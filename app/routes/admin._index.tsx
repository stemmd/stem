import { json } from "@remix-run/cloudflare";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

interface Stats {
  totalUsers: number;
  totalStems: number;
  totalFinds: number;
  pendingWaitlist: number;
  invitedWaitlist: number;
  recentSignups: number;
}

interface RecentUser {
  username: string;
  display_name: string | null;
  created_at: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = context.cloudflare.env.DB;

  const [
    usersResult,
    stemsResult,
    findsResult,
    pendingResult,
    invitedResult,
    recentSignupsResult,
    recentUsersResult,
  ] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM stems").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM finds").first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM waitlist WHERE invited_at IS NULL")
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) as count FROM waitlist WHERE invited_at IS NOT NULL")
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) as count FROM users WHERE created_at > datetime('now', '-7 days')"
      )
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT username, display_name, created_at FROM users ORDER BY created_at DESC LIMIT 10"
      )
      .all<RecentUser>(),
  ]);

  return json({
    stats: {
      totalUsers: usersResult?.count ?? 0,
      totalStems: stemsResult?.count ?? 0,
      totalFinds: findsResult?.count ?? 0,
      pendingWaitlist: pendingResult?.count ?? 0,
      invitedWaitlist: invitedResult?.count ?? 0,
      recentSignups: recentSignupsResult?.count ?? 0,
    } satisfies Stats,
    recentUsers: recentUsersResult.results ?? [],
  });
}

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  subtitle?: string;
}[] = [
  { key: "totalUsers", label: "Total Users" },
  { key: "totalStems", label: "Total Stems" },
  { key: "totalFinds", label: "Total Finds" },
  { key: "pendingWaitlist", label: "Pending Waitlist" },
  { key: "invitedWaitlist", label: "Invited Waitlist" },
  { key: "recentSignups", label: "New Users", subtitle: "last 7 days" },
];

export default function AdminDashboard() {
  const { stats, recentUsers } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 style={styles.heading}>Overview</h1>

      <div data-admin-grid style={styles.grid}>
        {STAT_CARDS.map((card) => (
          <div key={card.key} data-admin-card style={styles.card}>
            <span style={styles.cardLabel}>{card.label}</span>
            <span data-card-number style={styles.cardNumber}>{stats[card.key]}</span>
            {card.subtitle && (
              <span style={styles.cardSubtitle}>{card.subtitle}</span>
            )}
          </div>
        ))}
      </div>

      <h2 style={styles.sectionHeading}>Recent signups</h2>

      <div style={styles.tableWrap}>
        <table data-admin-table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Username</th>
              <th data-hide-mobile style={styles.th}>Display Name</th>
              <th style={styles.th}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr key={user.username}>
                <td style={styles.td}>{user.username}</td>
                <td data-hide-mobile style={styles.td}>{user.display_name ?? "—"}</td>
                <td style={styles.td}>
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={3}>
                  No users yet.
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
    marginBottom: 28,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  cardLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--ink-light)",
  },
  cardNumber: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 36,
    color: "var(--ink)",
    lineHeight: 1.1,
  },
  cardSubtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  sectionHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    fontWeight: 400,
    color: "var(--ink)",
    marginTop: 40,
    marginBottom: 16,
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
};
