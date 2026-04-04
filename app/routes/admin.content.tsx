import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";

interface FindRow {
  id: string;
  url: string;
  title: string | null;
  note: string | null;
  status: string;
  created_at: string;
  added_by_username: string;
  stem_title: string;
  stem_slug: string;
  stem_username: string;
}

interface ReportRow {
  id: number;
  find_id: string;
  reported_by_username: string;
  find_title: string | null;
  find_url: string;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;

  const [findsResult, reportsResult] = await Promise.all([
    db.prepare(`
      SELECT f.id, f.url, f.title, f.note, f.status, f.created_at,
             u.username as added_by_username,
             s.title as stem_title, s.slug as stem_slug,
             su.username as stem_username
      FROM finds f
      JOIN users u ON u.id = f.added_by
      JOIN stems s ON s.id = f.stem_id
      JOIN users su ON su.id = s.user_id
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all<FindRow>(),
    db.prepare(`
      SELECT r.id, r.find_id, r.reason, r.created_at, r.resolved_at,
             u.username as reported_by_username,
             f.title as find_title, f.url as find_url
      FROM reports r
      JOIN users u ON u.id = r.reported_by
      JOIN finds f ON f.id = r.find_id
      WHERE r.resolved_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all<ReportRow>(),
  ]);

  return json({ finds: findsResult.results ?? [], reports: reportsResult.results ?? [] });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "resolve_report") {
    const reportId = form.get("reportId") as string;
    await context.cloudflare.env.DB
      .prepare("UPDATE reports SET resolved_at = datetime('now'), resolved_by = 'admin' WHERE id = ?")
      .bind(reportId).run();
    return json({ success: true });
  }

  if (intent === "delete_find") {
    const findId = form.get("findId") as string;
    if (!findId) return json({ error: "Missing findId" }, { status: 400 });

    await context.cloudflare.env.DB.prepare("DELETE FROM finds WHERE id = ?")
      .bind(findId)
      .run();

    return json({ ok: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

function truncateUrl(url: string, max = 50): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname;
    return display.length > max ? display.slice(0, max) + "..." : display;
  } catch {
    return url.length > max ? url.slice(0, max) + "..." : url;
  }
}

export default function AdminContent() {
  const { finds, reports } = useLoaderData<typeof loader>();

  return (
    <div>
      {reports.length > 0 && (
        <>
          <h2 style={{ ...styles.heading, color: "var(--taken)" }}>
            Reported Content ({reports.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 40 }}>
            {reports.map((r) => (
              <div key={r.id} style={{ ...styles.card, borderColor: "var(--taken)", borderLeftWidth: 3 }}>
                <div style={styles.cardHeader}>
                  <span style={styles.cardTitle}>{r.find_title || r.find_url}</span>
                </div>
                <p style={styles.cardMeta}>
                  Reported by @{r.reported_by_username} · {new Date(r.created_at + "Z").toLocaleDateString()}
                  {r.reason && ` · "${r.reason}"`}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="resolve_report" />
                    <input type="hidden" name="reportId" value={r.id} />
                    <button type="submit" style={styles.resolveBtn}>Dismiss</button>
                  </Form>
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="delete_find" />
                    <input type="hidden" name="findId" value={r.find_id} />
                    <button type="submit" style={styles.deleteBtn}>Delete find</button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h1 style={styles.heading}>Recent Content</h1>
      <p style={styles.subtitle}>{finds.length} finds (most recent 100)</p>

      <div style={styles.list}>
        {finds.map((find) => (
          <div key={find.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                {find.title || "Untitled"}
              </div>
              <Form method="post" style={{ margin: 0 }}>
                <input type="hidden" name="intent" value="delete_find" />
                <input type="hidden" name="findId" value={find.id} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm(`Delete this find?`)) {
                      e.preventDefault();
                    }
                  }}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </Form>
            </div>

            <a
              href={find.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.url}
            >
              {truncateUrl(find.url)}
            </a>

            {find.note && (
              <p style={styles.note}>{find.note}</p>
            )}

            <div style={styles.meta}>
              <span>
                Added by{" "}
                <Link to={`/${find.added_by_username}`} style={styles.metaLink}>
                  @{find.added_by_username}
                </Link>
              </span>
              <span style={styles.metaSep}>·</span>
              <span>
                to{" "}
                <Link
                  to={`/${find.stem_username}/${find.stem_slug}`}
                  style={styles.metaLink}
                >
                  {find.stem_title}
                </Link>
                {" "}by{" "}
                <Link to={`/${find.stem_username}`} style={styles.metaLink}>
                  @{find.stem_username}
                </Link>
              </span>
              <span style={styles.metaSep}>·</span>
              <span style={styles.mono}>
                {new Date(find.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
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
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    padding: 16,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
  },
  url: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--forest)",
    textDecoration: "none",
    display: "block",
    marginBottom: 6,
  },
  note: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    margin: "6px 0",
    lineHeight: 1.4,
  },
  meta: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 8,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  metaLink: {
    color: "var(--forest)",
    textDecoration: "none",
    fontWeight: 500,
  },
  metaSep: {
    color: "var(--ink-light)",
    margin: "0 2px",
  },
  mono: {
    fontFamily: "'DM Mono', monospace",
  },
  resolveBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 4,
    border: "1px solid var(--paper-dark)",
    background: "transparent",
    color: "var(--ink-mid)",
    cursor: "pointer",
    fontWeight: 500,
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
    flexShrink: 0,
  },
};
