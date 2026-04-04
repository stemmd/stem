import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import { nanoid } from "nanoid";
import { createNotification } from "~/lib/notifications.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const stemId = params.id!;
  const db = context.cloudflare.env.DB;

  const form = await request.formData();
  const actionType = form.get("action");

  if (actionType === "follow") {
    await db
      .prepare("INSERT OR IGNORE INTO stem_follows (id, follower_id, stem_id) VALUES (?, ?, ?)")
      .bind(`sf_${nanoid(10)}`, user.id, stemId)
      .run();
    // Notify stem owner
    const stem = await db
      .prepare("SELECT user_id FROM stems WHERE id = ?")
      .bind(stemId)
      .first<{ user_id: string }>();
    if (stem) {
      await createNotification({ db, userId: stem.user_id, type: "stem_followed", actorId: user.id, stemId });
    }
  } else if (actionType === "unfollow") {
    await db
      .prepare("DELETE FROM stem_follows WHERE follower_id = ? AND stem_id = ?")
      .bind(user.id, stemId)
      .run();
  }

  return json({ success: true });
}
