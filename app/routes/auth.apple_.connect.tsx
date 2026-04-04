import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);

  const clientId = "md.stem.web";
  const state = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const redirectUri = new URL("/auth/apple/connect/callback", origin).toString();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code id_token",
    response_mode: "form_post",
    scope: "email",
    state,
  });

  // Store both state and user ID in cookies.
  // The session cookie won't survive Apple's cross-origin form POST (SameSite=Lax),
  // so we need a separate cookie with SameSite=None to identify the user in the callback.
  return redirect(`https://appleid.apple.com/auth/authorize?${params}`, {
    headers: [
      ["Set-Cookie", `apple_connect_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`],
      ["Set-Cookie", `apple_connect_user=${user.id}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=600`],
    ],
  });
}
