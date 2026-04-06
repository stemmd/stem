import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { Nav } from "~/components/Nav";
import { UserCard, type UserCardData } from "~/components/UserCard";
import { StemCard } from "~/components/StemCard";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.profile ? `${data.profile.username} is following — Stem` : "Stem" },
];

interface FollowedStem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  is_branch: number;
  artifact_count: number;
  owner_username: string;
  owner_display_name: string | null;
}

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { username } = params;
  const user = await getUser(request, context);
  const db = context.cloudflare.env.DB;

  const profile = await db
    .prepare("SELECT id, username, display_name FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: string; username: string; display_name: string | null }>();

  if (!profile) throw new Response("Not found", { status: 404 });

  const [{ results: following }, { results: followedStems }] = await Promise.all([
    db
      .prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio
        FROM user_follows uf
        JOIN users u ON u.id = uf.following_id
        WHERE uf.follower_id = ?
        ORDER BY uf.created_at DESC
        LIMIT 100
      `)
      .bind(profile.id)
      .all<UserCardData>(),

    db
      .prepare(`
        SELECT s.id, s.title, s.slug, s.description, s.emoji, s.is_branch,
               u.username as owner_username, u.display_name as owner_display_name,
               (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count
        FROM stem_follows sf
        JOIN stems s ON s.id = sf.stem_id
        JOIN users u ON u.id = s.user_id
        WHERE sf.follower_id = ? AND s.visibility = 'public'
        ORDER BY sf.created_at DESC
        LIMIT 100
      `)
      .bind(profile.id)
      .all<FollowedStem>(),
  ]);

  // Which of the followed users does the current user also follow?
  const followingSet = new Set<string>();
  if (user && following.length > 0) {
    const placeholders = following.map(() => "?").join(",");
    const { results } = await db
      .prepare(`SELECT following_id FROM user_follows WHERE follower_id = ? AND following_id IN (${placeholders})`)
      .bind(user.id, ...following.map((f) => f.id))
      .all<{ following_id: string }>();
    results.forEach((r) => followingSet.add(r.following_id));
  }

  return json({ profile, following, followedStems, followingSet: [...followingSet], user });
}

export default function Following() {
  const { profile, following, followedStems, followingSet, user } = useLoaderData<typeof loader>();
  const followingIds = new Set(followingSet);
  const name = profile.display_name || profile.username;

  return (
    <div style={styles.page}>
      <Nav user={user} />
      <main style={styles.main}>
        <Link to={`/${profile.username}`} style={styles.back}>← {name}</Link>
        <h1 style={styles.heading}>Following</h1>

        {following.length === 0 && followedStems.length === 0 && (
          <p style={styles.empty}>Not following anyone yet.</p>
        )}

        {following.length > 0 && (
          <section style={styles.section}>
            {followedStems.length > 0 && (
              <h2 style={styles.sectionHeading}>People</h2>
            )}
            {following.map((person) => (
              <UserCard
                key={person.id}
                person={person}
                isFollowing={followingIds.has(person.id)}
                currentUserId={user?.id ?? null}
              />
            ))}
          </section>
        )}

        {followedStems.length > 0 && (
          <section style={{ ...styles.section, marginTop: following.length > 0 ? 40 : 0 }}>
            {following.length > 0 && (
              <h2 style={styles.sectionHeading}>Stems & Branches</h2>
            )}
            <div style={styles.stemGrid}>
              {followedStems.map((stem) => (
                <StemCard
                  key={stem.id}
                  to={`/${stem.owner_username}/${stem.slug}`}
                  title={stem.title}
                  emoji={stem.emoji ?? undefined}
                  description={stem.description}
                  artifactCount={stem.artifact_count}
                  username={stem.owner_username}
                  showAuthor
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 680, margin: "0 auto", padding: "40px 24px" },
  back: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    textDecoration: "none", display: "block", marginBottom: 24,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif", fontSize: 32,
    fontWeight: 400, color: "var(--ink)", marginBottom: 32,
  },
  section: {},
  sectionHeading: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    color: "var(--ink-light)", textTransform: "uppercase" as const,
    letterSpacing: "0.08em", marginBottom: 16,
  },
  stemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  },
  empty: {
    fontFamily: "'DM Serif Display', serif", fontStyle: "italic" as const,
    fontSize: 18, color: "var(--ink-light)", padding: "60px 0", textAlign: "center" as const,
  },
};
