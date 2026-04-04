import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { nanoid } from "nanoid";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  picture: string;
}

function sessionCookie(sessionId: string) {
  const maxAge = 60 * 60 * 24 * 30;
  return `stem_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearStateCookie() {
  return `google_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Verify CSRF state
  const isMobile = state?.startsWith("mobile:");
  const cookieHeader = request.headers.get("Cookie") || "";
  const stateCookie = cookieHeader.match(/google_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || state !== stateCookie) {
    throw redirect("/signin?error=invalid_link");
  }

  const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.cloudflare.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = new URL("/auth/google/callback", url.origin).toString();
  const db = context.cloudflare.env.DB;

  // Exchange code for tokens
  let tokens: GoogleTokenResponse;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error("token exchange failed");
    tokens = await res.json<GoogleTokenResponse>();
  } catch {
    throw redirect("/signin?error=invalid_link");
  }

  // Get user info
  let googleUser: GoogleUserInfo;
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) throw new Error("userinfo failed");
    googleUser = await res.json<GoogleUserInfo>();
  } catch {
    throw redirect("/signin?error=invalid_link");
  }

  if (!googleUser.email_verified) {
    throw redirect("/signin?error=invalid_link");
  }

  const email = googleUser.email.toLowerCase();

  // Check if user already exists — try google_id first, then email
  let user = await db
    .prepare("SELECT id FROM users WHERE google_id = ?")
    .bind(googleUser.sub)
    .first<{ id: string }>();

  if (!user) {
    user = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first<{ id: string }>();
  }

  if (!user) {
    // Must be on the waitlist to sign up
    const waitlistEntry = await db
      .prepare("SELECT username, invited_at FROM waitlist WHERE email = ? AND username IS NOT NULL")
      .bind(email)
      .first<{ username: string; invited_at: string | null }>();

    if (!waitlistEntry || !waitlistEntry.invited_at) {
      const name = encodeURIComponent(googleUser.name || "");
      const em = encodeURIComponent(email);
      throw redirect(`/waitlist?email=${em}&name=${name}`);
    }

    // Create the user from waitlist data
    const userId = `usr_${nanoid(10)}`;
    const avatarUrl = googleUser.picture || null;
    await db
      .prepare(`
        INSERT INTO users (id, email, username, display_name, avatar_url, google_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(userId, email, waitlistEntry.username, googleUser.name || null, avatarUrl, googleUser.sub)
      .run();

    const defaultFollow = context.cloudflare.env.DEFAULT_FOLLOW_USERNAME;
    if (defaultFollow) {
      await db.prepare(
        "INSERT OR IGNORE INTO user_follows (follower_id, following_id) SELECT ?, id FROM users WHERE username = ?"
      ).bind(userId, defaultFollow).run();
    }

    user = { id: userId };
  } else {
    // Update avatar from Google if none set; store google_id if not already linked
    await db
      .prepare(`
        UPDATE users SET
          avatar_url = CASE WHEN (avatar_url IS NULL OR avatar_url = '') THEN ? ELSE avatar_url END,
          google_id = CASE WHEN google_id IS NULL THEN ? ELSE google_id END
        WHERE id = ?
      `)
      .bind(googleUser.picture || null, googleUser.sub, user.id)
      .run();
  }

  // Create session
  const sessionId = `ses_${nanoid(20)}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString().replace("T", " ").slice(0, 19);

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(sessionId, user.id, expiresAt)
    .run();

  if (isMobile) {
    return redirect(`stem://auth?token=${sessionId}`, {
      headers: [["Set-Cookie", clearStateCookie()]],
    });
  }

  return redirect("/feed", {
    headers: [
      ["Set-Cookie", sessionCookie(sessionId)],
      ["Set-Cookie", clearStateCookie()],
    ],
  });
}
