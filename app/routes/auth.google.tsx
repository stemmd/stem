import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { requireNoUser } from "~/lib/auth.server";
import { validateUsername } from "~/lib/username";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const mobile = url.searchParams.get("mobile");
  const username = url.searchParams.get("username");

  // Skip auth check for mobile (ephemeral browser has no session)
  if (!mobile) await requireNoUser(request, context);

  // Validate username if provided (from landing page CTA)
  if (username && !validateUsername(username).valid) {
    throw redirect("/?error=invalid_username");
  }

  const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
  // Encode mobile flag and/or username in state so callback can use them
  const csrfToken = crypto.randomUUID();
  let state: string;
  if (mobile === "1") {
    state = `mobile:${csrfToken}`;
  } else if (username) {
    state = `signup:${username}:${csrfToken}`;
  } else {
    state = csrfToken;
  }
  const redirectUri = new URL("/auth/google/callback", url.origin).toString();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, {
    headers: {
      "Set-Cookie": `google_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
