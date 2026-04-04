import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

function base64UrlDecode(str: string): string {
  // Convert base64url to standard base64 and add padding
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  return atob(base64);
}

// Apple uses form_post response mode, so the callback is a POST
export async function action({ request, context }: ActionFunctionArgs) {
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  const idToken = form.get("id_token") as string | null;
  const state = form.get("state") as string | null;

  const cookieHeader = request.headers.get("Cookie") || "";
  const stateCookie = cookieHeader.match(/apple_connect_state=([^;]+)/)?.[1];
  const userId = cookieHeader.match(/apple_connect_user=([^;]+)/)?.[1];

  // Log for debugging
  console.log("Apple connect callback:", {
    hasIdToken: !!idToken,
    hasState: !!state,
    hasStateCookie: !!stateCookie,
    stateMatch: state === stateCookie,
    hasUserId: !!userId,
  });

  if (!state || state !== stateCookie || !idToken || !userId) {
    const reason = !state ? "no_state" : !stateCookie ? "no_state_cookie" : state !== stateCookie ? "state_mismatch" : !idToken ? "no_token" : "no_user";
    console.log("Apple connect failed:", reason);
    throw redirect(`/settings?error=connect_failed&reason=${reason}`);
  }

  const user = await db.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first();
  if (!user) throw redirect("/settings?error=connect_failed&reason=user_not_found");

  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) throw new Error("invalid token format");
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    if (payload.iss !== "https://appleid.apple.com") throw new Error("bad issuer: " + payload.iss);

    const appleId = payload.sub;
    if (!appleId) throw new Error("no sub claim");

    const existing = await db
      .prepare("SELECT id FROM users WHERE apple_id = ? AND id != ?")
      .bind(appleId, userId)
      .first();
    if (existing) {
      throw redirect("/settings?error=apple_already_linked");
    }

    await db
      .prepare("UPDATE users SET apple_id = ? WHERE id = ?")
      .bind(appleId, userId)
      .run();

    return redirect("/settings?linked=apple", {
      headers: [
        ["Set-Cookie", "apple_connect_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"],
        ["Set-Cookie", "apple_connect_user=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0"],
      ],
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    console.error("Apple connect error:", e);
    throw redirect("/settings?error=connect_failed&reason=parse_error");
  }
}
