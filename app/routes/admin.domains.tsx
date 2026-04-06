import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import { requireAdmin } from "~/lib/auth.server";

interface BlockedDomain {
  id: number;
  domain: string;
  category: string;
  added_at: string;
}

const CATEGORIES = ["adult", "scam", "darkweb", "piracy", "gore", "gambling", "spam", "other"];

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;
  const url = new URL(request.url);
  const cat = url.searchParams.get("cat") || "";
  const q = url.searchParams.get("q") || "";

  let query = "SELECT id, domain, category, added_at FROM blocked_domains";
  const conditions: string[] = [];
  const bindings: string[] = [];

  if (cat) {
    conditions.push("category = ?");
    bindings.push(cat);
  }
  if (q) {
    conditions.push("domain LIKE ?");
    bindings.push(`%${q}%`);
  }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY added_at DESC";

  const { results } = await db.prepare(query).bind(...bindings).all<BlockedDomain>();

  const { results: countResults } = await db
    .prepare("SELECT category, COUNT(*) as count FROM blocked_domains GROUP BY category ORDER BY count DESC")
    .all<{ category: string; count: number }>();

  return json({ domains: results, categoryCounts: countResults, cat, q });
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "add") {
    const domain = (form.get("domain") as string || "").trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "");
    const category = (form.get("category") as string) || "other";
    if (!domain) return json({ error: "Domain is required." });
    await db.prepare("INSERT OR IGNORE INTO blocked_domains (domain, category, added_by) VALUES (?, ?, 'admin')")
      .bind(domain, category).run();
    return json({ success: true });
  }

  if (intent === "delete") {
    const id = form.get("id") as string;
    await db.prepare("DELETE FROM blocked_domains WHERE id = ?").bind(id).run();
    return json({ success: true });
  }

  return json({ error: "Unknown intent." });
}

export default function AdminDomains() {
  const { domains, categoryCounts, cat, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const submitting = navigation.state === "submitting";

  const totalCount = categoryCounts.reduce((sum, c) => sum + c.count, 0);

  return (
    <div>
      <h2 style={styles.heading}>Blocked Domains</h2>
      <p style={styles.subtext}>{totalCount} domains blocked across {categoryCounts.length} categories</p>

      {/* Add form */}
      <Form method="post" style={styles.addForm}>
        <input type="hidden" name="intent" value="add" />
        <input
          type="text"
          name="domain"
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          style={styles.input}
        />
        <select name="category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={styles.select}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button type="submit" disabled={submitting || !newDomain.trim()} style={styles.addBtn}>
          Add domain
        </button>
      </Form>

      {/* Category filter */}
      <div style={styles.filters}>
        <Link
          to="/admin/domains"
          style={{ ...styles.filterPill, background: !cat ? "var(--forest)" : "var(--paper-mid)", color: !cat ? "#fff" : "var(--ink-mid)" }}
        >
          All ({totalCount})
        </Link>
        {categoryCounts.map((c) => (
          <Link
            key={c.category}
            to={`/admin/domains?cat=${c.category}`}
            style={{
              ...styles.filterPill,
              background: cat === c.category ? "var(--forest)" : "var(--paper-mid)",
              color: cat === c.category ? "#fff" : "var(--ink-mid)",
            }}
          >
            {c.category} ({c.count})
          </Link>
        ))}
      </div>

      {/* Search */}
      <Form method="get" style={styles.searchForm}>
        {cat && <input type="hidden" name="cat" value={cat} />}
        <input type="text" name="q" defaultValue={q} placeholder="Search domains..." data-admin-search style={styles.searchInput} />
      </Form>

      {/* Table */}
      <table data-admin-table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Domain</th>
            <th style={styles.th}>Category</th>
            <th data-hide-mobile style={styles.th}>Added</th>
            <th style={{ ...styles.th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d.id}>
              <td style={styles.td}>
                <span style={styles.domainText}>{d.domain}</span>
              </td>
              <td style={styles.td}>
                <span style={styles.catBadge}>{d.category}</span>
              </td>
              <td data-hide-mobile style={styles.td}>
                <span style={styles.dateText}>
                  {new Date(d.added_at + "Z").toLocaleDateString()}
                </span>
              </td>
              <td style={styles.td}>
                <Form method="post" style={{ display: "inline" }}>
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" style={styles.deleteBtn} title="Remove">×</button>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {domains.length === 0 && (
        <p style={styles.empty}>No domains found.</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24, fontWeight: 400, color: "var(--ink)", marginBottom: 4,
  },
  subtext: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, color: "var(--ink-light)", marginBottom: 24,
  },
  addForm: {
    display: "flex", gap: 8, alignItems: "center",
    marginBottom: 20, flexWrap: "wrap" as const,
  },
  input: {
    flex: 1, minWidth: 200,
    padding: "8px 12px", background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)", borderRadius: 6,
    fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink)",
    outline: "none",
  },
  select: {
    padding: "8px 12px", background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)", borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink)",
    outline: "none",
  },
  addBtn: {
    padding: "8px 16px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    cursor: "pointer",
  },
  filters: {
    display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 16,
  },
  filterPill: {
    padding: "4px 10px", borderRadius: 12,
    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
    textDecoration: "none", border: "1px solid var(--paper-dark)",
  },
  searchForm: { marginBottom: 16 },
  searchInput: {
    width: "100%", maxWidth: 300,
    padding: "8px 12px", background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)", borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink)",
    outline: "none",
  },
  table: {
    width: "100%", borderCollapse: "collapse" as const,
  },
  th: {
    fontFamily: "'DM Mono', monospace", fontSize: 10,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    color: "var(--ink-light)", textAlign: "left" as const,
    padding: "8px 12px", borderBottom: "1px solid var(--paper-dark)",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid var(--paper-mid)",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink)",
  },
  domainText: {
    fontFamily: "'DM Mono', monospace", fontSize: 13,
  },
  catBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: "2px 8px", borderRadius: 8,
    background: "var(--paper-mid)", color: "var(--ink-mid)",
  },
  dateText: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
  },
  deleteBtn: {
    background: "none", border: "none",
    color: "var(--taken)", fontSize: 18, cursor: "pointer",
    fontFamily: "sans-serif", padding: "2px 6px",
  },
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: "var(--ink-light)",
    textAlign: "center" as const, padding: "40px 0",
  },
};
