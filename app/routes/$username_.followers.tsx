import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { getUser } from "~/lib/auth.server";
import { Nav } from "~/components/Nav";
import { UserCard, type UserCardData } from "~/components/UserCard";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.profile ? `${data.profile.username}'s followers — Stem` : "Stem" },
];

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { username } = params;
  const user = await getUser(request, context);
  const db = context.cloudflare.env.DB;

  const profile = await db
    .prepare("SELECT id, username, display_name FROM users WHERE username = ?")
    .bind(username)
    .first<{ id: string; username: string; display_name: string | null }>();

  if (!profile) throw new Response("Not found", { status: 404 });

  const { results: followers } = await db
    .prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio
      FROM user_follows uf
      JOIN users u ON u.id = uf.follower_id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
      LIMIT 100
    `)
    .bind(profile.id)
    .all<UserCardData>();

  // Which of these followers does the current user follow?
  const followingSet = new Set<string>();
  if (user && followers.length > 0) {
    const placeholders = followers.map(() => "?").join(",");
    const { results } = await db
      .prepare(`SELECT following_id FROM user_follows WHERE follower_id = ? AND following_id IN (${placeholders})`)
      .bind(user.id, ...followers.map((f) => f.id))
      .all<{ following_id: string }>();
    results.forEach((r) => followingSet.add(r.following_id));
  }

  return json({ profile, followers, followingSet: [...followingSet], user });
}

export default function Followers() {
  const { profile, followers, followingSet, user } = useLoaderData<typeof loader>();
  const followingIds = new Set(followingSet);
  const name = profile.display_name || profile.username;

  return (
    <div style={styles.page}>
      <Nav user={user} />
      <main style={styles.main}>
        <Link to={`/${profile.username}`} style={styles.back}>← {name}</Link>
        <h1 style={styles.heading}>Followers</h1>

        {followers.length === 0 ? (
          <p style={styles.empty}>No followers yet.</p>
        ) : (
          <div>
            {followers.map((person) => (
              <UserCard
                key={person.id}
                person={person}
                isFollowing={followingIds.has(person.id)}
                currentUserId={user?.id ?? null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 600, margin: "0 auto", padding: "40px 24px" },
  back: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    textDecoration: "none", display: "block", marginBottom: 24,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif", fontSize: 32,
    fontWeight: 400, color: "var(--ink)", marginBottom: 32,
  },
  empty: {
    fontFamily: "'DM Serif Display', serif", fontStyle: "italic" as const,
    fontSize: 18, color: "var(--ink-light)", padding: "60px 0", textAlign: "center" as const,
  },
};
