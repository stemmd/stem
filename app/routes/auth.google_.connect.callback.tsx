import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieHeader = request.headers.get("Cookie") || "";
  const stateCookie = cookieHeader.match(/google_connect_state=([^;]+)/)?.[1];
  if (!code || !state || state !== stateCookie) {
    throw redirect("/settings?error=connect_failed");
  }

  const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
  const clientSecret = context.cloudflare.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = new URL("/auth/google/connect/callback", url.origin).toString();
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
    throw redirect("/settings?error=connect_failed");
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
    throw redirect("/settings?error=connect_failed");
  }

  if (!googleUser.email_verified) {
    throw redirect("/settings?error=connect_failed");
  }

  // Check google_id isn't already claimed by a different account
  const existing = await db
    .prepare("SELECT id FROM users WHERE google_id = ? AND id != ?")
    .bind(googleUser.sub, user.id)
    .first<{ id: string }>();

  if (existing) {
    throw redirect("/settings?error=google_already_linked");
  }

  await db
    .prepare("UPDATE users SET google_id = ? WHERE id = ?")
    .bind(googleUser.sub, user.id)
    .run();

  return redirect("/settings?linked=google", {
    headers: {
      "Set-Cookie": `google_connect_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}
