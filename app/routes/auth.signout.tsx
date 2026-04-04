import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { getSessionCookie } from "~/lib/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const sessionId = getSessionCookie(request);

  if (sessionId) {
    await context.cloudflare.env.DB
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sessionId)
      .run();
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": "stem_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

export async function loader() {
  throw redirect("/");
}
