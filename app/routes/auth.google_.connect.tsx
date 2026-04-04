import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  // Must be logged in to link a Google account
  await requireUser(request, context);

  const clientId = context.cloudflare.env.GOOGLE_CLIENT_ID;
  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const redirectUri = new URL("/auth/google/connect/callback", origin).toString();

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
      "Set-Cookie": `google_connect_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
