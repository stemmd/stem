import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requireUser } from "~/lib/auth.server";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { formatRelative, getDomain } from "~/lib/utils";
import { getCategoryTint } from "~/components/StemPickers";
import { track } from "~/lib/analytics";

export const meta: MetaFunction = () => [{ title: "Feed — Stem" }];

interface FeedItem {
  id: string;
  url: string;
  title: string | null;
  image_url: string | null;
  favicon_url: string | null;
  note: string | null;
  created_at: string;
  stem_title: string;
  stem_slug: string;
  stem_username: string;
  stem_emoji: string | null;
  stem_category: string | null;
  contributor_username: string;
  contributor_display_name: string | null;
}

const PAGE_SIZE = 30;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");

  const bindings: (string | null)[] = [user.id, user.id, user.id, user.id, user.id, user.id, user.id, user.id];
  let beforeClause = "";
  if (before) {
    beforeClause = " AND f.created_at < ?";
    bindings.push(before);
  }

  const { results: artifacts } = await db
    .prepare(`
      SELECT f.id, f.url, f.title, f.image_url, f.favicon_url, f.note, f.created_at,
             s.title as stem_title, s.slug as stem_slug, s.emoji as stem_emoji,
             su.username as stem_username,
             cu.username as contributor_username,
             cu.display_name as contributor_display_name,
             (SELECT sc.category_id FROM stem_categories sc WHERE sc.stem_id = s.id LIMIT 1) as stem_category
      FROM artifacts f
      JOIN stems s ON s.id = f.stem_id
      JOIN users su ON su.id = s.user_id
      JOIN users cu ON cu.id = f.added_by
      WHERE f.status = 'approved'
        AND (
          s.user_id = ?
          OR s.visibility = 'public'
          OR (s.visibility = 'mutuals' AND (
            SELECT COUNT(*) FROM user_follows
            WHERE (follower_id = ? AND following_id = s.user_id)
               OR (follower_id = s.user_id AND following_id = ?)
          ) = 2)
        )
        AND (
          s.user_id = ?
          OR s.id IN (SELECT stem_id FROM stem_follows WHERE follower_id = ?)
          OR s.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = ?)
        )
        AND f.added_by NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?)
        AND su.id NOT IN (SELECT blocked_user_id FROM user_blocks WHERE user_id = ?)${beforeClause}
      ORDER BY f.created_at DESC
      LIMIT ${PAGE_SIZE + 1}
    `)
    .bind(...bindings)
    .all<FeedItem>();

  const hasMore = artifacts.length > PAGE_SIZE;
  return json({ user, artifacts: hasMore ? artifacts.slice(0, PAGE_SIZE) : artifacts, hasMore });
}

function getTimePeriod(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + "Z");
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    return dayName;
  }
  return "Earlier";
}

interface StemGroup {
  key: string;
  stemTitle: string;
  stemSlug: string;
  stemUsername: string;
  stemEmoji: string | null;
  stemCategory: string | null;
  latestAt: string;
  artifacts: FeedItem[];
}

function groupArtifacts(artifacts: FeedItem[]): StemGroup[] {
  const groups: StemGroup[] = [];
  for (const item of artifacts) {
    const key = `${item.stem_username}/${item.stem_slug}`;
    const existing = groups.find((g) => g.key === key);
    if (existing) {
      existing.artifacts.push(item);
    } else {
      groups.push({
        key,
        stemTitle: item.stem_title,
        stemSlug: item.stem_slug,
        stemUsername: item.stem_username,
        stemEmoji: item.stem_emoji,
        stemCategory: item.stem_category,
        latestAt: item.created_at,
        artifacts: [item],
      });
    }
  }
  return groups;
}

interface TimePeriodGroup {
  period: string;
  stemGroups: StemGroup[];
}

const PERIOD_ORDER = [
  "Today", "Yesterday",
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  "Earlier",
];

function groupByTimePeriod(artifacts: FeedItem[]): TimePeriodGroup[] {
  const stemGroups = groupArtifacts(artifacts);
  const periodMap = new Map<string, StemGroup[]>();

  for (const group of stemGroups) {
    const period = getTimePeriod(group.latestAt);
    if (!periodMap.has(period)) {
      periodMap.set(period, []);
    }
    periodMap.get(period)!.push(group);
  }

  // Sort stem groups within each period by most recent artifact
  for (const groups of periodMap.values()) {
    groups.sort((a, b) => new Date(b.latestAt + "Z").getTime() - new Date(a.latestAt + "Z").getTime());
  }

  return PERIOD_ORDER
    .filter((period) => periodMap.has(period))
    .map((period) => ({ period, stemGroups: periodMap.get(period)! }));
}

export default function Feed() {
  const { user, artifacts: initialArtifacts, hasMore: initialHasMore } = useLoaderData<typeof loader>();
  const moreFetcher = useFetcher<{ artifacts: FeedItem[]; hasMore: boolean }>();
  const [allArtifacts, setAllArtifacts] = useState<FeedItem[]>(initialArtifacts);
  const [hasMore, setHasMore] = useState(initialHasMore);

  useEffect(() => { track("page_view", { page: "feed" }); }, []);

  // Reset on navigation
  useEffect(() => {
    setAllArtifacts(initialArtifacts);
    setHasMore(initialHasMore);
  }, [initialArtifacts, initialHasMore]);

  // Append results when more loads
  useEffect(() => {
    if (moreFetcher.state === "idle" && moreFetcher.data) {
      setAllArtifacts((prev) => [...prev, ...moreFetcher.data!.artifacts]);
      setHasMore(moreFetcher.data.hasMore);
    }
  }, [moreFetcher.state, moreFetcher.data]);

  const loadMore = () => {
    const oldest = allArtifacts[allArtifacts.length - 1]?.created_at;
    if (oldest) moreFetcher.load(`/feed?before=${encodeURIComponent(oldest)}`);
  };

  const timePeriods = groupByTimePeriod(allArtifacts);

  return (
    <div style={styles.page}>
      <Nav user={user} />
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Feed</h1>
          <Link to="/explore" style={styles.exploreLink}>Explore stems</Link>
        </div>

        {allArtifacts.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>
              Follow some stems to see what people are exploring.
            </p>
            <Link to="/explore" style={styles.emptyBtn}>Browse stems</Link>
          </div>
        ) : (
          <>
            {timePeriods.map((tp) => (
              <div key={tp.period}>
                <h2 style={styles.periodHeading}>{tp.period}</h2>
                <div style={styles.periodDivider} />

                {tp.stemGroups.map((group) => (
                  <Link
                    key={group.key}
                    to={`/${group.stemUsername}/${group.stemSlug}`}
                    style={{ ...styles.group, background: getCategoryTint(group.stemCategory), textDecoration: "none", display: "block" }}
                  >
                    <div style={styles.groupHeader}>
                      <span style={styles.groupStemLink}>
                        {group.stemEmoji && <span style={styles.groupEmoji}>{group.stemEmoji}</span>}
                        {group.stemTitle}
                      </span>
                      <span style={styles.groupMeta}>
                        · @{group.stemUsername}
                      </span>
                    </div>
                    <div style={styles.artifactList}>
                      {group.artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          style={styles.artifactRow}
                        >
                          <span style={styles.artifactRowTitle}>{artifact.title || artifact.url}</span>
                          {artifact.url && <span style={styles.artifactRowDomain}>{getDomain(artifact.url)}</span>}
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ))}

            {hasMore && (
              <div style={{ textAlign: "center" as const, marginTop: 32 }}>
                <button
                  onClick={loadMore}
                  disabled={moreFetcher.state !== "idle"}
                  style={styles.loadMoreBtn}
                >
                  {moreFetcher.state !== "idle" ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 640, margin: "0 auto", padding: "40px 24px" },

  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32,
    fontWeight: 400,
    color: "var(--ink)",
  },
  exploreLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--forest)",
    fontWeight: 500,
  },

  periodHeading: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    textTransform: "uppercase" as const,
    color: "var(--forest)",
    letterSpacing: "0.1em",
    marginBottom: 16,
    fontWeight: 500,
  },
  periodDivider: {
    height: 1,
    background: "var(--paper-dark)",
    marginBottom: 20,
  },

  group: {
    borderRadius: 10,
    border: "1px solid var(--paper-dark)",
    padding: 16,
    marginBottom: 12,
  },
  groupHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap" as const,
  },
  groupStemLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  groupEmoji: { fontSize: 16 },
  groupMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },

  artifactList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  artifactRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "4px 0",
    textDecoration: "none",
    color: "inherit",
  },
  artifactRowTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
    minWidth: 0,
  },
  artifactRowDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    flexShrink: 0,
  },

  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 20,
    padding: "100px 0",
    textAlign: "center" as const,
  },
  emptyText: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 22,
    color: "var(--ink-mid)",
    maxWidth: 340,
    lineHeight: 1.5,
  },
  loadMoreBtn: {
    padding: "10px 28px",
    background: "transparent",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    cursor: "pointer",
  },
  emptyBtn: {
    padding: "10px 24px",
    background: "var(--forest)",
    color: "#fff",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    textDecoration: "none",
  },
};
