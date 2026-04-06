import { json } from "@remix-run/cloudflare";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { API_BASE } from "~/lib/config";

interface WaitlistEntry {
  id: number;
  username: string;
  email: string;
  invited_at: string | null;
  created_at: string;
}

type Filter = "all" | "pending" | "invited";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") ?? "all") as Filter;
  const db = context.cloudflare.env.DB;

  let query = "SELECT id, username, email, invited_at, created_at FROM waitlist";
  if (filter === "pending") {
    query += " WHERE invited_at IS NULL";
  } else if (filter === "invited") {
    query += " WHERE invited_at IS NOT NULL";
  }
  query += " ORDER BY created_at DESC";

  const result = await db.prepare(query).all<WaitlistEntry>();

  return json({
    entries: result.results ?? [],
    total: result.results?.length ?? 0,
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "invite") {
    const email = form.get("email") as string;
    if (!email) {
      return json({ error: "Email is required" }, { status: 400 });
    }

    const adminSecret = context.cloudflare.env.ADMIN_SECRET;
    const res = await fetch(`${API_BASE}/admin/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminSecret}`,
      },
      body: JSON.stringify({ emails: [email] }),
    });

    if (!res.ok) {
      const text = await res.text();
      return json(
        { error: `Invite failed: ${text}` },
        { status: res.status }
      );
    }

    return json({ success: true, message: "Invite sent" });
  }

  if (intent === "add_to_waitlist") {
    const email = (form.get("email") as string || "").toLowerCase().trim();
    const username = (form.get("username") as string || "").toLowerCase().trim();
    const alsoInvite = form.get("also_invite") === "1";

    if (!email || !email.includes("@")) {
      return json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!username || username.length < 3) {
      return json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    const db = context.cloudflare.env.DB;

    // Check for duplicates
    const existing = await db.prepare("SELECT id FROM waitlist WHERE email = ? OR username = ? COLLATE NOCASE")
      .bind(email, username).first();
    if (existing) {
      return json({ error: "That email or username is already on the waitlist" }, { status: 400 });
    }

    await db.prepare("INSERT INTO waitlist (username, email) VALUES (?, ?)")
      .bind(username, email).run();

    // Optionally send invite immediately
    if (alsoInvite) {
      const adminSecret = context.cloudflare.env.ADMIN_SECRET;
      const res = await fetch(`${API_BASE}/admin/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({ emails: [email] }),
      });

      if (!res.ok) {
        return json({ success: true, message: "Added to waitlist but invite email failed" });
      }

      return json({ success: true, message: "Added and invite sent" });
    }

    return json({ success: true, message: "Added to waitlist" });
  }

  if (intent === "delete_entry") {
    const entryId = form.get("entryId") as string;
    if (!entryId) return json({ error: "Missing entry ID" }, { status: 400 });

    await context.cloudflare.env.DB.prepare("DELETE FROM waitlist WHERE id = ?")
      .bind(entryId).run();

    return json({ success: true, message: "Entry removed" });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "invited", label: "Invited" },
];

export default function AdminWaitlist() {
  const { entries, total } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const currentFilter = (searchParams.get("filter") ?? "all") as Filter;
  const submitting = navigation.state === "submitting";
  const submittingIntent = submitting ? navigation.formData?.get("intent") : null;
  const submittingEmail = submitting ? navigation.formData?.get("email") : null;

  const [addEmail, setAddEmail] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [alsoInvite, setAlsoInvite] = useState(true);

  return (
    <div>
      <h1 style={styles.heading}>Waitlist</h1>
      <p style={styles.count}>{total} entries</p>

      {/* Add to waitlist form */}
      <div style={styles.addSection}>
        <h2 style={styles.addHeading}>Add to waitlist</h2>
        <Form method="post" style={styles.addForm}>
          <input type="hidden" name="intent" value="add_to_waitlist" />
          <input type="hidden" name="also_invite" value={alsoInvite ? "1" : "0"} />
          <input
            type="email"
            name="email"
            placeholder="email@example.com"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            style={styles.addInput}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="username"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value.toLowerCase())}
            style={{ ...styles.addInput, maxWidth: 160 }}
            required
          />
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={alsoInvite}
              onChange={(e) => setAlsoInvite(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Send invite
          </label>
          <button
            type="submit"
            disabled={submitting && submittingIntent === "add_to_waitlist"}
            style={styles.addBtn}
          >
            {submitting && submittingIntent === "add_to_waitlist" ? "Adding..." : "Add"}
          </button>
        </Form>
      </div>

      <div style={styles.tabs}>
        {FILTERS.map((f) => {
          const active = f.value === currentFilter;
          return (
            <Link
              key={f.value}
              to={`/admin/waitlist${f.value === "all" ? "" : `?filter=${f.value}`}`}
              style={{
                ...styles.tab,
                background: active ? "var(--leaf)" : "transparent",
                color: active ? "var(--forest)" : "var(--ink-mid)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {actionData && "success" in actionData && (
        <p style={{ ...styles.count, color: "var(--forest)", marginBottom: 16 }}>
          {(actionData as { success: boolean; message?: string }).message || "Done"}
        </p>
      )}
      {actionData && "error" in actionData && (
        <p style={{ ...styles.count, color: "var(--taken)", marginBottom: 16 }}>{(actionData as { error: string }).error}</p>
      )}

      <div style={styles.tableWrap}>
        <table data-admin-table style={styles.table}>
          <thead>
            <tr>
              <th data-hide-mobile style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Status</th>
              <th data-hide-mobile style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const invited = !!entry.invited_at;
              return (
                <tr key={entry.id}>
                  <td data-hide-mobile style={styles.td}>{entry.username}</td>
                  <td style={styles.td}>{entry.email}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: invited
                          ? "var(--leaf)"
                          : "var(--paper-mid)",
                        color: invited
                          ? "var(--forest)"
                          : "var(--ink-light)",
                      }}
                    >
                      {invited ? "✓ Invited" : "Pending"}
                    </span>
                  </td>
                  <td data-hide-mobile style={styles.td}>
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {!invited && (
                        <Form method="post" style={{ display: "inline" }}>
                          <input type="hidden" name="intent" value="invite" />
                          <input type="hidden" name="email" value={entry.email} />
                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              ...styles.inviteBtn,
                              opacity: submittingEmail === entry.email ? 0.6 : 1,
                            }}
                          >
                            {submittingEmail === entry.email ? "Sending..." : "Invite"}
                          </button>
                        </Form>
                      )}
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="intent" value="delete_entry" />
                        <input type="hidden" name="entryId" value={entry.id} />
                        <button
                          type="submit"
                          disabled={submitting}
                          onClick={(e) => {
                            if (!confirm(`Remove ${entry.email} from waitlist?`)) {
                              e.preventDefault();
                            }
                          }}
                          style={styles.deleteBtn}
                        >
                          ×
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={5}>
                  No entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 4,
  },
  count: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    marginBottom: 20,
  },
  // Add to waitlist section
  addSection: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  addHeading: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 12,
  },
  addForm: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  addInput: {
    flex: 1,
    minWidth: 140,
    padding: "8px 12px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
  },
  checkboxLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap" as const,
  },
  addBtn: {
    padding: "8px 16px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
  },
  tab: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 6,
    transition: "background 0.1s",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
  },
  th: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--ink-light)",
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "1px solid var(--paper-dark)",
  },
  td: {
    padding: "10px 12px",
    color: "var(--ink)",
    borderBottom: "1px solid var(--paper-dark)",
  },
  badge: {
    display: "inline-block",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 10px",
    borderRadius: 100,
  },
  inviteBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 14px",
    border: "1px solid var(--forest)",
    borderRadius: 6,
    background: "var(--leaf)",
    color: "var(--forest)",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "none",
    border: "1px solid var(--taken)",
    color: "var(--taken)",
    fontSize: 16,
    cursor: "pointer",
    padding: "2px 8px",
    borderRadius: 4,
    fontFamily: "sans-serif",
    lineHeight: 1,
  },
};
