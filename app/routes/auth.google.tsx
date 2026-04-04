import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { requireNoUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const mobile = url.searchParams.get("mobile");

  // Skip auth check for mobile (ephemeral browser has no session)
  if (!mobile) await requireNoUser(request, context);

  const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
  // Encode mobile flag in state so callback knows to redirect to app
  const state = mobile === "1" ? `mobile:${crypto.randomUUID()}` : crypto.randomUUID();
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
