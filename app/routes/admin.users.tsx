import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { requireAdmin } from "~/lib/auth.server";

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  stem_count: number;
  find_count: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  let query = `
    SELECT u.id, u.username, u.display_name, u.email, u.avatar_url, u.created_at,
           (SELECT COUNT(*) FROM stems WHERE user_id = u.id) as stem_count,
           (SELECT COUNT(*) FROM finds WHERE added_by = u.id) as find_count
    FROM users u
  `;

  const bindings: string[] = [];
  if (q) {
    query += ` WHERE u.username LIKE ? OR u.email LIKE ?`;
    bindings.push(`%${q}%`, `%${q}%`);
  }

  query += ` ORDER BY u.created_at DESC`;

  const stmt = context.cloudflare.env.DB.prepare(query);
  const { results } = await (bindings.length ? stmt.bind(...bindings) : stmt).all<UserRow>();

  return json({ users: results ?? [], q });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete_user") {
    const userId = form.get("userId") as string;
    if (!userId) return json({ error: "Missing userId" }, { status: 400 });

    const db = context.cloudflare.env.DB;

    // Get user's stem IDs for cascading deletes
    const { results: userStems } = await db
      .prepare("SELECT id FROM stems WHERE user_id = ?")
      .bind(userId)
      .all<{ id: string }>();
    const stemIds = userStems?.map((s) => s.id) ?? [];

    // Build batch of cascading deletes
    const batch = [
      db.prepare("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?").bind(userId, userId),
      db.prepare("DELETE FROM push_subscriptions WHERE user_id = ?").bind(userId),
      db.prepare("DELETE FROM import_sources WHERE user_id = ?").bind(userId),
      db.prepare("DELETE FROM reports WHERE reported_by = ?").bind(userId),
      db.prepare("DELETE FROM finds WHERE added_by = ?").bind(userId),
    ];

    // Delete data associated with user's stems
    for (const stemId of stemIds) {
      batch.push(
        db.prepare("DELETE FROM featured_stems WHERE stem_id = ?").bind(stemId),
        db.prepare("DELETE FROM stem_categories WHERE stem_id = ?").bind(stemId),
        db.prepare("DELETE FROM stem_follows WHERE stem_id = ?").bind(stemId),
        db.prepare("DELETE FROM branch_members WHERE branch_id = ?").bind(stemId),
      );
    }

    batch.push(
      db.prepare("DELETE FROM stems WHERE user_id = ?").bind(userId),
      db.prepare("DELETE FROM stem_follows WHERE follower_id = ?").bind(userId),
      db.prepare("DELETE FROM user_follows WHERE follower_id = ? OR following_id = ?").bind(userId, userId),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
      db.prepare("DELETE FROM auth_tokens WHERE user_id = ? OR email = (SELECT email FROM users WHERE id = ?)").bind(userId, userId),
      db.prepare("DELETE FROM users WHERE id = ?").bind(userId),
    );

    await db.batch(batch);

    return json({ ok: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export default function AdminUsers() {
  const { users, q } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const submitting = navigation.state === "submitting";

  useEffect(() => {
    setSearch(q);
  }, [q]);

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      navigate(`/admin/users?${params.toString()}`, { replace: true });
    }, 300);
  }

  return (
    <div>
      <h1 style={styles.heading}>Users</h1>
      <p style={styles.subtitle}>{users.length} users{q ? ` matching "${q}"` : ""}</p>

      <input
        type="text"
        placeholder="Search by username or email..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        data-admin-search
        style={styles.searchInput}
      />

      <div style={styles.tableWrap}>
        <table data-admin-table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th data-hide-mobile style={styles.th}>Display Name</th>
              <th data-hide-mobile style={styles.th}>Email</th>
              <th data-hide-mobile style={{ ...styles.th, textAlign: "right" }}>Stems</th>
              <th data-hide-mobile style={{ ...styles.th, textAlign: "right" }}>Finds</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>
                  <Link to={`/${user.username}`} style={styles.usernameLink}>
                    @{user.username}
                  </Link>
                </td>
                <td data-hide-mobile style={styles.td}>{user.display_name || "—"}</td>
                <td data-hide-mobile style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  {user.email || "—"}
                </td>
                <td data-hide-mobile style={{ ...styles.td, textAlign: "right", ...styles.mono }}>
                  {user.stem_count}
                </td>
                <td data-hide-mobile style={{ ...styles.td, textAlign: "right", ...styles.mono }}>
                  {user.find_count}
                </td>
                <td style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td style={styles.td}>
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="delete_user" />
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      type="submit"
                      disabled={submitting}
                      onClick={(e) => {
                        if (!confirm(`Delete @${user.username}? This will permanently remove their account, all their stems, finds, and follows.`)) {
                          e.preventDefault();
                        }
                      }}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  No users found.
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
    fontSize: 24,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    marginBottom: 16,
  },
  searchInput: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
    background: "var(--surface)",
    color: "var(--ink)",
    width: "100%",
    maxWidth: 360,
    marginBottom: 24,
    outline: "none",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid var(--paper-dark)",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--ink-light)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--paper-dark)",
    color: "var(--ink)",
    whiteSpace: "nowrap",
  },
  usernameLink: {
    color: "var(--forest)",
    textDecoration: "none",
    fontWeight: 500,
  },
  mono: {
    fontFamily: "'DM Mono', monospace",
  },
  deleteBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 4,
    border: "1px solid var(--taken)",
    background: "transparent",
    color: "var(--taken)",
    cursor: "pointer",
    fontWeight: 500,
  },
};
