import { json } from "@remix-run/cloudflare";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
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

    return json({ success: true });
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
  const submittingEmail = submitting ? navigation.formData?.get("email") : null;

  return (
    <div>
      <h1 style={styles.heading}>Waitlist</h1>
      <p style={styles.count}>{total} entries</p>

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
        <p style={{ ...styles.count, color: "var(--forest)", marginBottom: 16 }}>Invite sent successfully.</p>
      )}
      {actionData && "error" in actionData && (
        <p style={{ ...styles.count, color: "var(--taken)", marginBottom: 16 }}>{actionData.error}</p>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const invited = !!entry.invited_at;
              return (
                <tr key={entry.id}>
                  <td style={styles.td}>{entry.username}</td>
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
                  <td style={styles.td}>
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td style={styles.td}>
                    {invited ? (
                      <span style={styles.invitedCheck}>✓</span>
                    ) : (
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
  invitedCheck: {
    color: "var(--forest)",
    fontSize: 16,
    fontWeight: 600,
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
};
