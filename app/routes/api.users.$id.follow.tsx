import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import { nanoid } from "nanoid";
import { createNotification } from "~/lib/notifications.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const targetId = params.id!;
  const db = context.cloudflare.env.DB;

  // Prevent self-follow
  if (user.id === targetId) return json({ error: "Cannot follow yourself." }, { status: 400 });

  const form = await request.formData();
  const actionType = form.get("action");

  if (actionType === "follow") {
    await db
      .prepare("INSERT OR IGNORE INTO user_follows (id, follower_id, following_id) VALUES (?, ?, ?)")
      .bind(`uf_${nanoid(10)}`, user.id, targetId)
      .run();
    await createNotification({ db, userId: targetId, type: "new_follower", actorId: user.id });
  } else if (actionType === "unfollow") {
    await db
      .prepare("DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?")
      .bind(user.id, targetId)
      .run();
  }

  return json({ success: true });
}
