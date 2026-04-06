import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { getUser } from "~/lib/auth.server";
import { stemVisibilityFilter } from "~/lib/stems.server";
import { getGravatarUrl } from "~/lib/utils";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { StemCard } from "~/components/StemCard";
import { CATEGORIES, getCategoryTint } from "~/components/StemPickers";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.profile) return [{ title: "Stem" }];
  const { profile, gravatarUrl } = data;
  const name = profile.display_name || profile.username;
  const description = profile.bio ?? `Follow ${name}'s explorations on Stem.`;
  const url = `https://stem.md/${profile.username}`;
  const image = profile.avatar_url || gravatarUrl;
  return [
    { title: `${name} — Stem` },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: `${name} — Stem` },
    { property: "og:description", content: description },
    { property: "og:type", content: "profile" },
    { property: "og:site_name", content: "Stem" },
    { property: "og:url", content: url },
    ...(image ? [{ property: "og:image", content: image }] : []),
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: `${name} — Stem` },
    { name: "twitter:description", content: description },
    ...(image ? [{ name: "twitter:image", content: image }] : []),
    ...(profile.twitter ? [{ name: "twitter:creator", content: `@${profile.twitter}` }] : []),
  ];
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  website: string | null;
  twitter: string | null;
  mastodon: string | null;
  email: string;
}

interface ProfileStem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  updated_at: string;
  artifact_count: number;
  visibility: string;
}

interface StemCategory {
  stem_id: string;
  category_id: string;
}

interface CategorySection {
  categoryId: string;
  emoji: string;
  name: string;
  stems: ProfileStem[];
}

// ── Loader ────────────────────────────────────────────────────────────────────

const STEMS_PER_PAGE = 24;

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { username } = params;
  const user = await getUser(request, context);
  const db = context.cloudflare.env.DB;
  const url = new URL(request.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10));

  const profile = await db
    .prepare(
      "SELECT id, username, display_name, avatar_url, bio, created_at, website, twitter, mastodon, email FROM users WHERE username = ?"
    )
    .bind(username)
    .first<Profile>();

  if (!profile) throw new Response("Not found", { status: 404 });

  const [stemsResult, stemCategoriesResult, followerRow, followingRow, followRow, blockRow] = await Promise.all([
    db
      .prepare(`
        SELECT s.id, s.title, s.slug, s.description, s.emoji, s.updated_at, s.visibility,
               (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count
        FROM stems s
        WHERE s.user_id = ? AND ${stemVisibilityFilter(user?.id ?? null).sql}
        ORDER BY s.updated_at DESC
        LIMIT ${STEMS_PER_PAGE + 1} OFFSET ${page * STEMS_PER_PAGE}
      `)
      .bind(profile.id, ...stemVisibilityFilter(user?.id ?? null).bindings)
      .all<ProfileStem>(),

    db
      .prepare(
        `SELECT sc.stem_id, sc.category_id FROM stem_categories sc WHERE sc.stem_id IN (SELECT id FROM stems WHERE user_id = ?)`
      )
      .bind(profile.id)
      .all<StemCategory>(),

    db
      .prepare("SELECT COUNT(*) as c FROM user_follows WHERE following_id = ?")
      .bind(profile.id)
      .first<{ c: number }>(),

    db
      .prepare("SELECT COUNT(*) as c FROM user_follows WHERE follower_id = ?")
      .bind(profile.id)
      .first<{ c: number }>(),

    user && user.id !== profile.id
      ? db
          .prepare(
            "SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?"
          )
          .bind(user.id, profile.id)
          .first()
      : Promise.resolve(null),

    user && user.id !== profile.id
      ? db
          .prepare("SELECT id FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?")
          .bind(user.id, profile.id)
          .first()
      : Promise.resolve(null),
  ]);

  const gravatarUrl = await getGravatarUrl(profile.email);
  // Strip email from profile before sending to client
  const { email: _email, ...safeProfile } = profile;

  const hasMoreStems = stemsResult.results.length > STEMS_PER_PAGE;
  return json({
    profile: safeProfile,
    stems: hasMoreStems ? stemsResult.results.slice(0, STEMS_PER_PAGE) : stemsResult.results,
    stemCategories: stemCategoriesResult.results,
    hasMoreStems,
    page,
    user,
    isFollowing: !!followRow,
    isBlocked: !!blockRow,
    followerCount: followerRow?.c ?? 0,
    followingCount: followingRow?.c ?? 0,
    gravatarUrl,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupStemsByCategory(
  stems: ProfileStem[],
  stemCategories: StemCategory[],
  categories: typeof CATEGORIES
): CategorySection[] {
  const catMap = new Map<string, Set<string>>(); // categoryId -> set of stemIds
  for (const sc of stemCategories) {
    if (!catMap.has(sc.category_id)) catMap.set(sc.category_id, new Set());
    catMap.get(sc.category_id)!.add(sc.stem_id);
  }

  // Stems without categories go in an "Uncategorized" section
  const categorized = new Set(stemCategories.map((sc) => sc.stem_id));

  const sections: CategorySection[] = [];
  // Sort categories by number of stems descending
  const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1].size - a[1].size);

  for (const [catId, stemIds] of sortedCats) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    const catStems = stems.filter((s) => stemIds.has(s.id));
    if (catStems.length > 0) {
      sections.push({ categoryId: catId, emoji: cat.emoji, name: cat.name, stems: catStems });
    }
  }

  // Add uncategorized
  const uncatStems = stems.filter((s) => !categorized.has(s.id));
  if (uncatStems.length > 0) {
    sections.push({ categoryId: "", emoji: "📌", name: "Other", stems: uncatStems });
  }

  return sections;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UserProfile() {
  const {
    profile,
    stems: initialStems,
    stemCategories: initialStemCategories,
    hasMoreStems: initialHasMore,
    page: initialPage,
    user,
    isFollowing,
    isBlocked,
    followerCount,
    followingCount,
    gravatarUrl,
  } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();
  const blockFetcher = useFetcher();
  const moreStemsFetcher = useFetcher<{
    stems: ProfileStem[];
    stemCategories: StemCategory[];
    hasMoreStems: boolean;
    page: number;
  }>();
  const isOwnProfile = user?.id === profile.id;
  const [allStems, setAllStems] = useState<ProfileStem[]>(initialStems);
  const [allStemCategories, setAllStemCategories] = useState<StemCategory[]>(initialStemCategories);
  const [hasMoreStems, setHasMoreStems] = useState(initialHasMore);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    setAllStems(initialStems);
    setAllStemCategories(initialStemCategories);
    setHasMoreStems(initialHasMore);
    setCurrentPage(initialPage);
  }, [initialStems, initialStemCategories, initialHasMore, initialPage]);

  useEffect(() => {
    if (moreStemsFetcher.state === "idle" && moreStemsFetcher.data) {
      setAllStems((prev) => [...prev, ...moreStemsFetcher.data!.stems]);
      if (moreStemsFetcher.data.stemCategories) {
        setAllStemCategories((prev) => [...prev, ...moreStemsFetcher.data!.stemCategories]);
      }
      setHasMoreStems(moreStemsFetcher.data.hasMoreStems);
      setCurrentPage(moreStemsFetcher.data.page);
    }
  }, [moreStemsFetcher.state, moreStemsFetcher.data]);

  const loadMoreStems = () => {
    moreStemsFetcher.load(`/${profile.username}?page=${currentPage + 1}`);
  };

  const sections = useMemo(
    () => groupStemsByCategory(allStems, allStemCategories, CATEGORIES as unknown as typeof CATEGORIES),
    [allStems, allStemCategories]
  );

  // Optimistic follow state
  const optimisticFollowing =
    fetcher.formData
      ? fetcher.formData.get("action") === "follow"
      : isFollowing;

  // Optimistic block state
  const optimisticBlocked =
    blockFetcher.formData
      ? blockFetcher.formData.get("intent") === "block"
      : isBlocked;

  const initials = (profile.display_name || profile.username)
    .slice(0, 2)
    .toUpperCase();

  const name = profile.display_name || profile.username;
  const sameAs: string[] = [];
  if (profile.website) sameAs.push(profile.website);
  if (profile.twitter) sameAs.push(`https://twitter.com/${profile.twitter}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `https://stem.md/${profile.username}`,
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.avatar_url ? { image: profile.avatar_url } : gravatarUrl ? { image: gravatarUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <div style={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav user={user} />
      <main style={styles.main}>

        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {profile.avatar_url || gravatarUrl ? (
              <img
                src={profile.avatar_url || gravatarUrl}
                alt=""
                style={styles.avatarImg}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  img.nextElementSibling?.removeAttribute("style");
                }}
              />
            ) : null}
            <span style={{ ...styles.initials, display: profile.avatar_url || gravatarUrl ? "none" : "flex" }}>
              {initials}
            </span>
          </div>

          <div style={styles.profileInfo}>
            <h1 style={styles.displayName}>
              {profile.display_name || profile.username}
            </h1>
            <p style={styles.usernameText}>@{profile.username}</p>
            {profile.bio && <p style={styles.bio}>{profile.bio}</p>}
            <div style={styles.stats}>
              <Link to={`/${profile.username}/followers`} style={styles.statLink}>
                <strong style={styles.statNum}>{followerCount}</strong>{" "}
                {followerCount === 1 ? "follower" : "followers"}
              </Link>
              <span style={styles.statDivider}>·</span>
              <Link to={`/${profile.username}/following`} style={styles.statLink}>
                <strong style={styles.statNum}>{followingCount}</strong> following
              </Link>
              <span style={styles.statDivider}>·</span>
              <span style={styles.stat}>
                Joined{" "}
                {new Date(profile.created_at + "Z").toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {(profile.website || profile.twitter) && (
              <div style={styles.socialLinks}>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                    {profile.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>
                    @{profile.twitter}
                  </a>
                )}
              </div>
            )}
            {!isOwnProfile && (
              <div style={styles.followWrap}>
                {user ? (
                  <>
                    <fetcher.Form method="post" action={`/api/users/${profile.id}/follow`}>
                      <input
                        type="hidden"
                        name="action"
                        value={optimisticFollowing ? "unfollow" : "follow"}
                      />
                      <button
                        type="submit"
                        style={{
                          ...styles.followBtn,
                          background: optimisticFollowing ? "transparent" : "var(--forest)",
                          color: optimisticFollowing ? "var(--forest)" : "#fff",
                          border: optimisticFollowing ? "1px solid var(--forest)" : "none",
                        }}
                      >
                        {optimisticFollowing ? "Following" : "Follow"}
                      </button>
                    </fetcher.Form>
                    <blockFetcher.Form method="post" action="/api/block">
                      <input type="hidden" name="blocked_user_id" value={profile.id} />
                      <input type="hidden" name="intent" value={optimisticBlocked ? "unblock" : "block"} />
                      <button
                        type="submit"
                        style={styles.blockBtn}
                      >
                        <span style={{ color: optimisticBlocked ? "var(--taken)" : "var(--ink-light)" }}>
                          {optimisticBlocked ? "Blocked" : "Block"}
                        </span>
                      </button>
                    </blockFetcher.Form>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    style={{ ...styles.followBtn, background: "var(--forest)", color: "#fff", textDecoration: "none", border: "none" }}
                  >
                    Follow
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && allStems.length === 0 ? (
          <div style={styles.emptyOwner}>
            <p style={styles.emptyOwnerText}>
              You haven't started any stems yet.
            </p>
            <Link to="/new" style={styles.newBtn}>Start your first stem</Link>
          </div>
        ) : allStems.length === 0 ? (
          <p style={styles.empty}>Nothing here yet.</p>
        ) : (
          <>
            {sections.map((section) => (
              <div key={section.categoryId} style={{ marginBottom: 40 }}>
                <h3 style={styles.categoryHeading}>
                  {section.emoji} {section.name}
                </h3>
                <div style={styles.stemGrid}>
                  {section.stems.map((stem) => (
                    <StemCard
                      key={`${section.categoryId}-${stem.id}`}
                      to={`/${profile.username}/${stem.slug}`}
                      title={stem.title}
                      emoji={stem.emoji ?? undefined}
                      description={stem.description}
                      artifactCount={stem.artifact_count}
                      visibility={stem.visibility as "public" | "mutuals" | "private"}
                      categoryTint={getCategoryTint(section.categoryId)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {hasMoreStems && (
              <div style={{ textAlign: "center" as const, marginTop: 24 }}>
                <button
                  onClick={loadMoreStems}
                  disabled={moreStemsFetcher.state !== "idle"}
                  style={styles.loadMoreBtn}
                >
                  {moreStemsFetcher.state !== "idle" ? "Loading…" : "Show more"}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 800, margin: "0 auto", padding: "40px 24px" },
  loadMoreBtn: {
    padding: "10px 28px", background: "transparent",
    border: "1.5px solid var(--paper-dark)", borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", cursor: "pointer",
  },

  profileHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 24,
    marginBottom: 48,
    flexWrap: "wrap" as const,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "var(--paper-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" as const },
  initials: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    color: "var(--ink-mid)",
  },
  profileInfo: { flex: 1, minWidth: 200 },
  displayName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 2,
  },
  usernameText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "var(--ink-light)",
    marginBottom: 8,
  },
  bio: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  stats: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap" as const,
  },
  stat: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
  },
  statLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    textDecoration: "none",
  },
  statNum: { color: "var(--ink)", fontWeight: 500 },
  statDivider: { color: "var(--paper-dark)" },
  socialLinks: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
    marginTop: 6,
  },
  socialLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--forest)",
    textDecoration: "none",
  },
  socialText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },

  followWrap: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  followBtn: {
    display: "inline-block",
    padding: "8px 20px",
    border: "none",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },

  blockBtn: {
    background: "none",
    border: "none",
    padding: "4px 0",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    cursor: "pointer",
  },

  categoryHeading: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--ink-light)",
    marginBottom: 12,
  },

  stemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },

  empty: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 18,
    color: "var(--ink-light)",
    padding: "60px 0",
    textAlign: "center" as const,
  },
  emptyOwner: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
    padding: "80px 0",
    textAlign: "center" as const,
  },
  emptyOwnerText: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 20,
    color: "var(--ink-mid)",
  },
  newBtn: {
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
