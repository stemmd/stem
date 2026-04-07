import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";
import { nanoid } from "nanoid";

interface CategorySuggestion {
  id: string;
  name: string;
  emoji: string | null;
  username: string;
  status: string;
  created_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  emoji: string;
  stem_count: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;

  const [suggestions, categories] = await Promise.all([
    db.prepare(`
      SELECT cs.id, cs.name, cs.emoji, cs.status, cs.created_at, u.username
      FROM category_suggestions cs
      JOIN users u ON u.id = cs.suggested_by
      ORDER BY cs.status = 'pending' DESC, cs.created_at DESC
    `).all<CategorySuggestion>(),
    db.prepare(`
      SELECT c.id, c.name, c.emoji,
             (SELECT COUNT(DISTINCT sc.stem_id) FROM stem_categories sc WHERE sc.category_id = c.id) as stem_count
      FROM categories c
      ORDER BY stem_count DESC
    `).all<CategoryRow>(),
  ]);

  return json({
    suggestions: suggestions.results,
    categories: categories.results,
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "approve_suggestion") {
    const suggestionId = form.get("suggestionId") as string;
    const suggestion = await db
      .prepare("SELECT name, emoji FROM category_suggestions WHERE id = ?")
      .bind(suggestionId)
      .first<{ name: string; emoji: string | null }>();
    if (!suggestion) return json({ error: "Not found" }, { status: 404 });

    const catId = `cat_${suggestion.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO categories (id, name, emoji) VALUES (?, ?, ?)")
        .bind(catId, suggestion.name, suggestion.emoji || "📌"),
      db.prepare("UPDATE category_suggestions SET status = 'approved' WHERE id = ?")
        .bind(suggestionId),
    ]);
    return json({ ok: true });
  }

  if (intent === "reject_suggestion") {
    const suggestionId = form.get("suggestionId") as string;
    await db.prepare("UPDATE category_suggestions SET status = 'rejected' WHERE id = ?")
      .bind(suggestionId).run();
    return json({ ok: true });
  }

  if (intent === "delete_category") {
    const catId = form.get("catId") as string;
    await db.batch([
      db.prepare("DELETE FROM stem_categories WHERE category_id = ?").bind(catId),
      db.prepare("DELETE FROM categories WHERE id = ?").bind(catId),
    ]);
    return json({ ok: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
}

export default function AdminCategories() {
  const { suggestions, categories } = useLoaderData<typeof loader>();
  const pending = suggestions.filter((s) => s.status === "pending");

  return (
    <div>
      <h2 style={s.heading}>Categories</h2>
      <p style={s.sub}>{categories.length} categories, {pending.length} pending suggestions</p>

      {pending.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Pending Suggestions</h3>
          <div style={s.list}>
            {pending.map((sug) => (
              <SuggestionRow key={sug.id} suggestion={sug} />
            ))}
          </div>
        </div>
      )}

      <div style={s.section}>
        <h3 style={s.sectionTitle}>All Categories</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Emoji</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Stems</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ ...s.td, fontSize: 18, textAlign: "center", width: 40 }}>{cat.emoji}</td>
                <td style={s.td}>{cat.name}</td>
                <td style={{ ...s.td, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{cat.stem_count}</td>
                <td style={s.td}>
                  {cat.stem_count === 0 && <DeleteCatButton catId={cat.id} name={cat.name} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: CategorySuggestion }) {
  const fetcher = useFetcher();
  const acted = fetcher.state === "idle" && fetcher.data != null;
  if (acted) return null;

  return (
    <div style={s.suggestionRow}>
      <div style={{ flex: 1 }}>
        <span style={s.suggestionName}>
          {suggestion.emoji && `${suggestion.emoji} `}{suggestion.name}
        </span>
        <span style={s.suggestionMeta}>
          by @{suggestion.username} · {new Date(suggestion.created_at).toLocaleDateString()}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="approve_suggestion" />
          <input type="hidden" name="suggestionId" value={suggestion.id} />
          <button type="submit" style={s.approveBtn}>Approve</button>
        </fetcher.Form>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reject_suggestion" />
          <input type="hidden" name="suggestionId" value={suggestion.id} />
          <button type="submit" style={s.rejectBtn}>Reject</button>
        </fetcher.Form>
      </div>
    </div>
  );
}

function DeleteCatButton({ catId, name }: { catId: string; name: string }) {
  const fetcher = useFetcher();
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="delete_category" />
      <input type="hidden" name="catId" value={catId} />
      <button
        type="submit"
        onClick={(e) => { if (!confirm(`Delete category "${name}"?`)) e.preventDefault(); }}
        style={s.deleteBtn}
      >
        Delete
      </button>
    </fetcher.Form>
  );
}

const s: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400,
    color: "var(--ink)", marginBottom: 4,
  },
  sub: {
    fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink-light)", marginBottom: 32,
  },
  section: { marginBottom: 40 },
  sectionTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
    color: "var(--ink)", marginBottom: 12,
  },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  suggestionRow: {
    display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 8,
  },
  suggestionName: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)",
    display: "block",
  },
  suggestionMeta: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)", marginTop: 2,
    display: "block",
  },
  approveBtn: {
    padding: "5px 12px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 12,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer",
  },
  rejectBtn: {
    padding: "5px 12px", background: "none", color: "var(--taken)",
    border: "1px solid var(--taken)", borderRadius: 6, fontSize: 12,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  deleteBtn: {
    padding: "4px 10px", background: "none", color: "var(--taken)",
    border: "1px solid var(--taken)", borderRadius: 4, fontSize: 11,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  table: {
    width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  },
  th: {
    textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--paper-dark)",
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
    textTransform: "uppercase", letterSpacing: "0.06em",
  },
  td: {
    padding: "8px 12px", borderBottom: "1px solid var(--paper-dark)", color: "var(--ink)",
  },
};
