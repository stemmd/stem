import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";

interface AnalyticsData {
  period: { days: number; since: string };
  summary: { totalEvents: number; uniqueDevices: number };
  eventCounts: { name: string; count: number }[];
  dailyActivity: { day: string; count: number; devices: number }[];
  topEvents: { name: string; count: number }[];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const url = new URL(request.url);
  const days = url.searchParams.get("days") || "7";
  const adminSecret = context.cloudflare.env.ADMIN_SECRET;

  const res = await fetch(`https://api.stem.md/admin/analytics?days=${days}`, {
    headers: { Authorization: `Bearer ${adminSecret}` },
  });
  const data: AnalyticsData = await res.json();
  return json({ data, days: parseInt(days) });
}

export default function AdminAnalytics() {
  const { data, days } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const periods = [
    { label: "7d", value: "7" },
    { label: "14d", value: "14" },
    { label: "30d", value: "30" },
    { label: "90d", value: "90" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={styles.heading}>Analytics</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {periods.map((p) => (
            <Link
              key={p.value}
              to={`/admin/analytics?days=${p.value}`}
              style={{
                ...styles.pill,
                background: String(days) === p.value ? "var(--forest)" : "var(--paper-mid)",
                color: String(days) === p.value ? "#fff" : "var(--ink-mid)",
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={styles.cardRow}>
        <div style={styles.card}>
          <div style={styles.cardValue}>{data.summary.totalEvents.toLocaleString()}</div>
          <div style={styles.cardLabel}>Total events</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>{data.summary.uniqueDevices.toLocaleString()}</div>
          <div style={styles.cardLabel}>Unique devices</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>
            {data.summary.uniqueDevices > 0
              ? Math.round(data.summary.totalEvents / data.summary.uniqueDevices)
              : 0}
          </div>
          <div style={styles.cardLabel}>Events per device</div>
        </div>
      </div>

      {/* Daily activity */}
      <section style={{ marginTop: 32 }}>
        <h3 style={styles.sectionHeading}>Daily activity</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Day</th>
              <th style={styles.th}>Events</th>
              <th style={styles.th}>Devices</th>
            </tr>
          </thead>
          <tbody>
            {data.dailyActivity.map((d) => (
              <tr key={d.day}>
                <td style={styles.td}>{d.day}</td>
                <td style={styles.td}>{d.count}</td>
                <td style={styles.td}>{d.devices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Event breakdown */}
      <section style={{ marginTop: 32 }}>
        <h3 style={styles.sectionHeading}>Event breakdown</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Event</th>
              <th style={styles.th}>Count</th>
            </tr>
          </thead>
          <tbody>
            {data.topEvents.map((e) => (
              <tr key={e.name}>
                <td style={{ ...styles.td, fontFamily: "'DM Mono', monospace" }}>{e.name}</td>
                <td style={styles.td}>{e.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    color: "var(--ink)",
    margin: 0,
  },
  pill: {
    padding: "5px 12px",
    borderRadius: 16,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: "none",
    fontWeight: 500,
  },
  cardRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  card: {
    flex: "1 1 140px",
    padding: 20,
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
  },
  cardValue: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "var(--ink)",
  },
  cardLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    marginTop: 4,
  },
  sectionHeading: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink-mid)",
    marginBottom: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "1px solid var(--paper-dark)",
    color: "var(--ink-light)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'DM Mono', monospace",
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid var(--paper-mid)",
    color: "var(--ink)",
  },
};
