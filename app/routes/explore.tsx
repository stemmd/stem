import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { requireUser } from "~/lib/auth.server";
import { track } from "~/lib/analytics";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { StemCard } from "~/components/StemCard";
import { UserCard, type UserCardData } from "~/components/UserCard";
import { CATEGORIES, getCategoryTint } from "~/components/StemPickers";

export const meta: MetaFunction = () => [{ title: "Explore — Stem" }];

const EXPLORE_PAGE = 24;

interface ExploreStem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  username: string;
  display_name: string | null;
  artifact_count: number;
  updated_at: string;
  primary_category: string | null;
}

interface ExploreUser extends UserCardData {
  stem_count: number;
  follower_count: number;
  isFollowing: boolean;
}

interface CategoryCount {
  category_id: string;
  stem_count: number;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const cat = url.searchParams.get("cat") || "";
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10));
  const db = context.cloudflare.env.DB;

  // --- Filtered by category ---
  if (cat) {
    const bindings: string[] = [cat];
    let whereExtra = "";
    if (q) {
      whereExtra += " AND s.title LIKE ?";
      bindings.push(`%${q}%`);
    }

    const stems = await db
      .prepare(`
        SELECT s.id, s.title, s.slug, s.description, s.emoji, s.updated_at,
               u.username, u.display_name,
               (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count,
               (SELECT sc.category_id FROM stem_categories sc WHERE sc.stem_id = s.id LIMIT 1) as primary_category
        FROM stems s
        JOIN users u ON u.id = s.user_id
        WHERE s.visibility = 'public'
          AND s.id IN (SELECT stem_id FROM stem_categories WHERE category_id = ?)
          ${whereExtra}
        ORDER BY s.updated_at DESC
        LIMIT ${EXPLORE_PAGE + 1} OFFSET ${offset}
      `)
      .bind(...bindings)
      .all<ExploreStem>();

    const hasMore = stems.results.length > EXPLORE_PAGE;
    return json({
      user, q, cat, offset,
      stems: hasMore ? stems.results.slice(0, EXPLORE_PAGE) : stems.results,
      people: [] as ExploreUser[],
      categoryCounts: [] as CategoryCount[],
      trendingStems: [] as ExploreStem[],
      hasMore,
    });
  }

  // --- Search ---
  if (q) {
    const stems = await db
      .prepare(`
        SELECT s.id, s.title, s.slug, s.description, s.emoji, s.updated_at,
               u.username, u.display_name,
               (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count,
               (SELECT sc.category_id FROM stem_categories sc WHERE sc.stem_id = s.id LIMIT 1) as primary_category
        FROM stems s
        JOIN users u ON u.id = s.user_id
        WHERE s.visibility = 'public' AND s.title LIKE ?
        ORDER BY s.updated_at DESC
        LIMIT ${EXPLORE_PAGE + 1} OFFSET ${offset}
      `)
      .bind(`%${q}%`)
      .all<ExploreStem>();

    const hasMore = stems.results.length > EXPLORE_PAGE;
    return json({
      user, q, cat, offset,
      stems: hasMore ? stems.results.slice(0, EXPLORE_PAGE) : stems.results,
      people: [] as ExploreUser[],
      categoryCounts: [] as CategoryCount[],
      trendingStems: [] as ExploreStem[],
      hasMore,
    });
  }

  // --- Default: sectioned home view ---
  const [trendingStemsResult, categoryCountsResult, peopleResult] = await Promise.all([
    db.prepare(`
      SELECT s.id, s.title, s.slug, s.description, s.emoji, s.updated_at,
             u.username, u.display_name,
             (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count,
             (SELECT sc.category_id FROM stem_categories sc WHERE sc.stem_id = s.id LIMIT 1) as primary_category
      FROM stems s
      JOIN users u ON u.id = s.user_id
      WHERE s.visibility = 'public'
      ORDER BY s.updated_at DESC
      LIMIT 6
    `).all<ExploreStem>(),

    db.prepare(`
      SELECT sc.category_id, COUNT(DISTINCT sc.stem_id) as stem_count
      FROM stem_categories sc
      JOIN stems s ON s.id = sc.stem_id
      WHERE s.visibility = 'public'
      GROUP BY sc.category_id
      ORDER BY stem_count DESC
    `).all<CategoryCount>(),

    db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
             COUNT(DISTINCT s.id) as stem_count,
             COUNT(DISTINCT uf.follower_id) as follower_count
      FROM users u
      LEFT JOIN stems s ON s.user_id = u.id AND s.visibility = 'public'
      LEFT JOIN user_follows uf ON uf.following_id = u.id
      WHERE u.id IS NOT NULL
      GROUP BY u.id
      ORDER BY follower_count DESC, stem_count DESC
      LIMIT 8
    `).all<Omit<ExploreUser, "isFollowing">>(),
  ]);

  let followingIds = new Set<string>();
  if (user) {
    const following = await db
      .prepare("SELECT following_id FROM user_follows WHERE follower_id = ?")
      .bind(user.id)
      .all<{ following_id: string }>();
    followingIds = new Set(following.results.map((r) => r.following_id));
  }

  const peopleWithFollow: ExploreUser[] = peopleResult.results.map((p) => ({
    ...p,
    isFollowing: followingIds.has(p.id),
  }));

  return json({
    user, q, cat, offset,
    stems: [] as ExploreStem[],
    people: peopleWithFollow,
    categoryCounts: categoryCountsResult.results,
    trendingStems: trendingStemsResult.results,
    hasMore: false,
  });
}

export default function Explore() {
  const {
    user, q, cat, offset,
    stems: initialStems,
    people,
    categoryCounts,
    trendingStems,
    hasMore: initialHasMore,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreFetcher = useFetcher<{ stems: ExploreStem[]; hasMore: boolean; offset: number }>();
  const [allStems, setAllStems] = useState<ExploreStem[]>(initialStems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [currentOffset, setCurrentOffset] = useState(offset);

  useEffect(() => {
    setAllStems(initialStems);
    setHasMore(initialHasMore);
    setCurrentOffset(offset);
  }, [initialStems, initialHasMore, offset]);

  useEffect(() => {
    if (moreFetcher.state === "idle" && moreFetcher.data) {
      setAllStems((prev) => [...prev, ...moreFetcher.data!.stems]);
      setHasMore(moreFetcher.data.hasMore);
      setCurrentOffset(moreFetcher.data.offset);
    }
  }, [moreFetcher.state, moreFetcher.data]);

  const loadMore = () => {
    const params = new URLSearchParams(searchParams);
    params.set("offset", String(currentOffset + EXPLORE_PAGE));
    moreFetcher.load(`/explore?${params.toString()}`);
  };

  useEffect(() => setSearchValue(q), [q]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function handleSearch(val: string) {
    setSearchValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (val) {
        params.set("q", val);
        track("search", { query: val });
      }
      setSearchParams(params, { replace: true });
    }, 300);
  }

  const isDefault = !q && !cat;
  const isSearch = !!q;
  const isCatFilter = !!cat;

  const activeCat = CATEGORIES.find((c) => c.id === cat);

  // Build category count map
  const countMap = new Map<string, number>();
  for (const cc of categoryCounts) {
    countMap.set(cc.category_id, cc.stem_count);
  }

  return (
    <div style={styles.page}>
      <Nav user={user} />
      <main style={styles.main}>
        {/* Header + search */}
        <div style={styles.topBar}>
          <h1 style={styles.heading}>Explore</h1>
          <input
            type="search"
            placeholder="Search stems..."
            value={searchValue}
            style={styles.search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Category filter view */}
        {isCatFilter && (
          <>
            <Link to="/explore" style={styles.backLink}>
              &larr; Back to Explore
            </Link>
            <div style={styles.catHeader}>
              {activeCat && <span style={{ fontSize: 28 }}>{activeCat.emoji}</span>}
              <h2 style={styles.catTitle}>{activeCat?.name ?? cat}</h2>
            </div>
            {allStems.length === 0 ? (
              <p style={styles.empty}>No stems in this category yet.</p>
            ) : (
              <>
                <div style={styles.grid}>
                  {allStems.map((stem) => (
                    <StemCard
                      key={stem.id}
                      to={`/${stem.username}/${stem.slug}`}
                      title={stem.title}
                      emoji={stem.emoji ?? undefined}
                      description={stem.description}
                      artifactCount={stem.artifact_count}
                      username={stem.username}
                      showAuthor
                      categoryTint={getCategoryTint(stem.primary_category)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ textAlign: "center" as const, marginTop: 24 }}>
                    <button
                      onClick={loadMore}
                      disabled={moreFetcher.state !== "idle"}
                      style={styles.loadMoreBtn}
                    >
                      {moreFetcher.state !== "idle" ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Search results view */}
        {isSearch && (
          <>
            <p style={styles.searchResultsLabel}>
              Results for "<strong>{q}</strong>"
            </p>
            {allStems.length === 0 ? (
              <p style={styles.empty}>No stems found.</p>
            ) : (
              <>
                <div style={styles.grid}>
                  {allStems.map((stem) => (
                    <StemCard
                      key={stem.id}
                      to={`/${stem.username}/${stem.slug}`}
                      title={stem.title}
                      emoji={stem.emoji ?? undefined}
                      description={stem.description}
                      artifactCount={stem.artifact_count}
                      username={stem.username}
                      showAuthor
                      categoryTint={getCategoryTint(stem.primary_category)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div style={{ textAlign: "center" as const, marginTop: 24 }}>
                    <button
                      onClick={loadMore}
                      disabled={moreFetcher.state !== "idle"}
                      style={styles.loadMoreBtn}
                    >
                      {moreFetcher.state !== "idle" ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Default sectioned view */}
        {isDefault && (
          <>
            {/* Section 1: Trending */}
            <div style={{ marginTop: 8 }}>
              <p style={styles.sectionLabel}>Trending</p>
              {trendingStems.length === 0 ? (
                <p style={styles.empty}>Nothing here yet.</p>
              ) : (
                <div style={styles.grid}>
                  {trendingStems.map((stem) => (
                    <StemCard
                      key={stem.id}
                      to={`/${stem.username}/${stem.slug}`}
                      title={stem.title}
                      emoji={stem.emoji ?? undefined}
                      description={stem.description}
                      artifactCount={stem.artifact_count}
                      username={stem.username}
                      showAuthor
                      categoryTint={getCategoryTint(stem.primary_category)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Browse by category */}
            <div style={{ marginTop: 64 }}>
              <p style={styles.sectionLabel}>Browse by category</p>
              <div style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                  const count = countMap.get(c.id) ?? 0;
                  return (
                    <Link
                      key={c.id}
                      to={`/explore?cat=${c.id}`}
                      style={{
                        ...styles.catTile,
                        background: getCategoryTint(c.id),
                      }}
                    >
                      <span style={{ fontSize: 24, lineHeight: 1 }}>{c.emoji}</span>
                      <span style={styles.catTileName}>{c.name}</span>
                      <span style={styles.catTileCount}>
                        {count} {count === 1 ? "stem" : "stems"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section 3: People to follow */}
            <div style={{ marginTop: 64 }}>
              <p style={styles.sectionLabel}>People to follow</p>
              {people.length === 0 ? (
                <p style={styles.empty}>No one here yet.</p>
              ) : (
                <div style={styles.peopleList}>
                  {people.map((person) => (
                    <UserCard
                      key={person.id}
                      person={person}
                      isFollowing={person.isFollowing}
                      currentUserId={user?.id ?? null}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 1040, margin: "0 auto", padding: "32px 24px" },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 16,
    flexWrap: "wrap" as const,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32,
    fontWeight: 400,
    color: "var(--ink)",
  },
  search: {
    padding: "10px 14px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    outline: "none",
    width: 240,
  },
  sectionLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    textTransform: "uppercase" as const,
    color: "var(--forest)",
    letterSpacing: "0.12em",
    marginBottom: 16,
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 10,
  },
  catTile: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    padding: 16,
    textDecoration: "none",
    transition: "opacity 0.12s",
  },
  catTileName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    fontWeight: 500,
  },
  catTileCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  peopleList: {
    maxWidth: 680,
  },
  backLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--forest)",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: 16,
  },
  catHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  catTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26,
    fontWeight: 400,
    color: "var(--ink)",
  },
  searchResultsLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    marginBottom: 20,
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
  empty: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 18,
    color: "var(--ink-light)",
    padding: "80px 0",
    textAlign: "center" as const,
  },
};
