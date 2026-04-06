import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useFetcher, useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { requireAdmin } from "~/lib/auth.server";

interface StemRow {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  visibility: string;
  status: string;
  created_at: string;
  username: string;
  artifact_count: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  let query = `
    SELECT s.id, s.title, s.slug, s.emoji, s.visibility, s.status, s.created_at,
           u.username,
           (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count
    FROM stems s
    JOIN users u ON u.id = s.user_id
  `;

  const bindings: string[] = [];

  if (q) {
    query += ` WHERE s.title LIKE ?`;
    bindings.push(`%${q}%`);
  }

  query += ` ORDER BY s.updated_at DESC`;

  const stmt = context.cloudflare.env.DB.prepare(query);
  const { results } = await (bindings.length
    ? stmt.bind(...bindings)
    : stmt
  ).all<StemRow>();

  return json({ stems: results ?? [], q });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete_stem") {
    const stemId = form.get("stemId") as string;
    if (!stemId) return json({ error: "Missing stemId" }, { status: 400 });

    const db = context.cloudflare.env.DB;
    await db.batch([
      db.prepare("DELETE FROM artifacts WHERE stem_id = ?").bind(stemId),
      db.prepare("DELETE FROM stem_categories WHERE stem_id = ?").bind(stemId),
      db.prepare("DELETE FROM stem_follows WHERE stem_id = ?").bind(stemId),
      db.prepare("DELETE FROM stems WHERE id = ?").bind(stemId),
    ]);

    return json({ ok: true });
  }

  if (intent === "update_dates") {
    const stemId = form.get("stemId") as string;
    const createdAt = form.get("created_at") as string;
    if (!stemId || !createdAt) return json({ error: "Missing fields" }, { status: 400 });

    const db = context.cloudflare.env.DB;
    const dateStr = new Date(createdAt).toISOString().replace("T", " ").slice(0, 19);
    await db.prepare("UPDATE stems SET created_at = ?, updated_at = ? WHERE id = ?")
      .bind(dateStr, dateStr, stemId).run();

    return json({ ok: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export default function AdminStems() {
  const { stems, q } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
      navigate(`/admin/stems?${params.toString()}`, { replace: true });
    }, 300);
  }

  return (
    <div>
      <h1 style={styles.heading}>Stems</h1>
      <p style={styles.subtitle}>{stems.length} stems{q ? ` matching "${q}"` : ""}</p>

      <input
        type="text"
        placeholder="Search stems by title..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        data-admin-search
        style={styles.searchInput}
      />

      <div style={styles.tableWrap}>
        <table data-admin-table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Owner</th>
              <th data-hide-mobile style={{ ...styles.th, textAlign: "right" }}>Artifacts</th>
              <th data-hide-mobile style={styles.th}>Visibility</th>
              <th data-hide-mobile style={styles.th}>Status</th>
              <th data-hide-mobile style={styles.th}>Created</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {stems.map((stem) => (
              <tr key={stem.id}>
                <td style={{ ...styles.td, fontSize: 18, textAlign: "center", width: 40 }}>
                  {stem.emoji || "📌"}
                </td>
                <td style={styles.td}>
                  <Link
                    to={`/${stem.username}/${stem.slug}`}
                    style={styles.titleLink}
                  >
                    {stem.title}
                  </Link>
                </td>
                <td style={styles.td}>
                  <Link to={`/${stem.username}`} style={styles.ownerLink}>
                    @{stem.username}
                  </Link>
                </td>
                <td data-hide-mobile style={{ ...styles.td, textAlign: "right", ...styles.mono }}>
                  {stem.artifact_count}
                </td>
                <td data-hide-mobile style={styles.td}>
                  <VisibilityBadge visibility={stem.visibility} />
                </td>
                <td data-hide-mobile style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  {stem.status}
                </td>
                <td data-hide-mobile style={{ ...styles.td, ...styles.mono, fontSize: 12 }}>
                  <DateEditor stemId={stem.id} currentDate={stem.created_at} />
                </td>
                <td style={styles.td}>
                  <DeleteButton stemId={stem.id} title={stem.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    public: { bg: "#e6f4ea", color: "#1a7f37" },
    mutuals: { bg: "#fff4e5", color: "#9a6700" },
    private: { bg: "#eee", color: "#666" },
  };
  const c = colorMap[visibility] || colorMap.private;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        background: c.bg,
        color: c.color,
        textTransform: "capitalize",
      }}
    >
      {visibility}
    </span>
  );
}

function DateEditor({ stemId, currentDate }: { stemId: string; currentDate: string }) {
  const fetcher = useFetcher();
  const dateVal = new Date(currentDate + "Z").toISOString().slice(0, 16);
  const saved = fetcher.data && "ok" in (fetcher.data as Record<string, unknown>);

  return (
    <fetcher.Form method="post" style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input type="hidden" name="intent" value="update_dates" />
      <input type="hidden" name="stemId" value={stemId} />
      <input
        type="datetime-local"
        name="created_at"
        defaultValue={dateVal}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "var(--ink)",
          background: "var(--paper-mid)",
          border: "1px solid var(--paper-dark)",
          borderRadius: 4,
          padding: "3px 6px",
          outline: "none",
        }}
      />
      <button
        type="submit"
        style={{
          background: "none",
          border: "1px solid var(--paper-dark)",
          borderRadius: 4,
          padding: "3px 8px",
          fontSize: 11,
          fontFamily: "'DM Sans', sans-serif",
          color: saved ? "var(--forest)" : "var(--ink-mid)",
          cursor: "pointer",
        }}
      >
        {fetcher.state !== "idle" ? "..." : saved ? "✓" : "Save"}
      </button>
    </fetcher.Form>
  );
}

function DeleteButton({ stemId, title }: { stemId: string; title: string }) {
  return (
    <Form method="post">
      <input type="hidden" name="intent" value="delete_stem" />
      <input type="hidden" name="stemId" value={stemId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`Delete stem "${title}"? This will also delete all its artifacts, categories, and follows.`)) {
            e.preventDefault();
          }
        }}
        style={styles.deleteBtn}
      >
        Delete
      </button>
    </Form>
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
  titleLink: {
    color: "var(--forest)",
    textDecoration: "none",
    fontWeight: 500,
  },
  ownerLink: {
    color: "var(--ink-mid)",
    textDecoration: "none",
    fontSize: 13,
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
