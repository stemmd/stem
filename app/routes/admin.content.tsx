import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";

interface ArtifactRow {
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
  artifact_id: string;
  reported_by_username: string;
  artifact_title: string | null;
  artifact_url: string;
  reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;

  const [artifactsResult, reportsResult] = await Promise.all([
    db.prepare(`
      SELECT f.id, f.url, f.title, f.note, f.status, f.created_at,
             u.username as added_by_username,
             s.title as stem_title, s.slug as stem_slug,
             su.username as stem_username
      FROM artifacts f
      JOIN users u ON u.id = f.added_by
      JOIN stems s ON s.id = f.stem_id
      JOIN users su ON su.id = s.user_id
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all<ArtifactRow>(),
    db.prepare(`
      SELECT r.id, r.artifact_id, r.reason, r.created_at, r.resolved_at,
             u.username as reported_by_username,
             f.title as artifact_title, f.url as artifact_url
      FROM reports r
      JOIN users u ON u.id = r.reported_by
      JOIN artifacts f ON f.id = r.artifact_id
      WHERE r.resolved_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all<ReportRow>(),
  ]);

  return json({ artifacts: artifactsResult.results ?? [], reports: reportsResult.results ?? [] });
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

  if (intent === "delete_artifact") {
    const artifactId = form.get("artifactId") as string;
    if (!artifactId) return json({ error: "Missing artifactId" }, { status: 400 });

    await context.cloudflare.env.DB.prepare("DELETE FROM artifacts WHERE id = ?")
      .bind(artifactId)
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
  const { artifacts, reports } = useLoaderData<typeof loader>();

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
                  <span style={styles.cardTitle}>{r.artifact_title || r.artifact_url}</span>
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
                    <input type="hidden" name="intent" value="delete_artifact" />
                    <input type="hidden" name="artifactId" value={r.artifact_id} />
                    <button type="submit" style={styles.deleteBtn}>Delete artifact</button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h1 style={styles.heading}>Recent Content</h1>
      <p style={styles.subtitle}>{artifacts.length} artifacts (most recent 100)</p>

      <div style={styles.list}>
        {artifacts.map((artifact) => (
          <div key={artifact.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                {artifact.title || "Untitled"}
              </div>
              <Form method="post" style={{ margin: 0 }}>
                <input type="hidden" name="intent" value="delete_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!confirm(`Delete this artifact?`)) {
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
              href={artifact.url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.url}
            >
              {truncateUrl(artifact.url)}
            </a>

            {artifact.note && (
              <p style={styles.note}>{artifact.note}</p>
            )}

            <div style={styles.meta}>
              <span>
                Added by{" "}
                <Link to={`/${artifact.added_by_username}`} style={styles.metaLink}>
                  @{artifact.added_by_username}
                </Link>
              </span>
              <span style={styles.metaSep}>·</span>
              <span>
                to{" "}
                <Link
                  to={`/${artifact.stem_username}/${artifact.stem_slug}`}
                  style={styles.metaLink}
                >
                  {artifact.stem_title}
                </Link>
                {" "}by{" "}
                <Link to={`/${artifact.stem_username}`} style={styles.metaLink}>
                  @{artifact.stem_username}
                </Link>
              </span>
              <span style={styles.metaSep}>·</span>
              <span style={styles.mono}>
                {new Date(artifact.created_at).toLocaleDateString("en-US", {
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
