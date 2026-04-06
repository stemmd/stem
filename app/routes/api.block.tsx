import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import { nanoid } from "nanoid";

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  const form = await request.formData();
  const intent = form.get("intent") as string;
  const blocked_user_id = form.get("blocked_user_id") as string;

  if (!blocked_user_id) return json({ error: "Missing blocked_user_id." }, { status: 400 });
  if (user.id === blocked_user_id) return json({ error: "Cannot block yourself." }, { status: 400 });

  if (intent === "block") {
    await db
      .prepare("INSERT OR IGNORE INTO user_blocks (id, user_id, blocked_user_id) VALUES (?, ?, ?)")
      .bind(`blk_${nanoid(10)}`, user.id, blocked_user_id)
      .run();
    // Also unfollow in both directions
    await db
      .prepare("DELETE FROM user_follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)")
      .bind(user.id, blocked_user_id, blocked_user_id, user.id)
      .run();
    return json({ success: true });
  }

  if (intent === "unblock") {
    await db
      .prepare("DELETE FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?")
      .bind(user.id, blocked_user_id)
      .run();
    return json({ success: true });
  }

  return json({ error: "Unknown intent." }, { status: 400 });
}
