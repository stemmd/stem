import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";

interface UserRow {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  stem_count: number;
  artifact_count: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  const { results } = await context.cloudflare.env.DB.prepare(`
    SELECT u.id, u.username, u.display_name, u.email, u.avatar_url, u.created_at,
           (SELECT COUNT(*) FROM stems WHERE user_id = u.id) as stem_count,
           (SELECT COUNT(*) FROM artifacts WHERE added_by = u.id) as artifact_count
    FROM users u
    ORDER BY u.created_at DESC
  `).all<UserRow>();

  return json({ users: results ?? [] });
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={styles.heading}>Users</h1>
      <p style={styles.subtitle}>{users.length} total users</p>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Display Name</th>
              <th style={styles.th}>Email</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Stems</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Artifacts</th>
              <th style={styles.th}>Joined</th>
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
                <td style={styles.td}>{user.display_name || "—"}</td>
                <td style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  {user.email || "—"}
                </td>
                <td style={{ ...styles.td, textAlign: "right", ...styles.mono }}>
                  {user.stem_count}
                </td>
                <td style={{ ...styles.td, textAlign: "right", ...styles.mono }}>
                  {user.artifact_count}
                </td>
                <td style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
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
    marginBottom: 24,
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
};
