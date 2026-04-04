import type { AppLoadContext } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  website: string | null;
  twitter: string | null;
  mastodon: string | null;
  username_changed_at: string | null;
  google_id: string | null;
  apple_id: string | null;
}

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/stem_session=([^;]+)/);
  return match ? match[1] : null;
}

/** Extract session token from Authorization: Bearer header (for native apps). */
function getTokenFromHeader(request: Request): string | null {
  const auth = request.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function getUser(
  request: Request,
  context: AppLoadContext
): Promise<User | null> {
  const sessionId = getSessionCookie(request) || getTokenFromHeader(request);
  if (!sessionId) return null;

  const user = await context.cloudflare.env.DB
    .prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.created_at,
             u.website, u.twitter, u.mastodon, u.username_changed_at, u.google_id, u.apple_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
    .bind(sessionId)
    .first<User>();

  return user ?? null;
}

export async function requireUser(
  request: Request,
  context: AppLoadContext
): Promise<User> {
  const user = await getUser(request, context);
  if (!user) throw redirect("/signin");
  return user;
}

export async function requireAdmin(
  request: Request,
  context: AppLoadContext
): Promise<User> {
  const user = await requireUser(request, context);
  const adminUsername = context.cloudflare.env.ADMIN_USERNAME || "amrith";
  if (user.username !== adminUsername) throw redirect("/feed");
  return user;
}

export async function requireNoUser(
  request: Request,
  context: AppLoadContext
): Promise<void> {
  const user = await getUser(request, context);
  if (user) throw redirect("/feed");
}
