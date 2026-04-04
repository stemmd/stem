import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import type { UserCardData } from "~/components/UserCard";

export async function action({ request, params, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const branchId = params.id!;
  const db = context.cloudflare.env.DB;

  const branch = await db
    .prepare("SELECT id, user_id FROM stems WHERE id = ? AND is_branch = 1")
    .bind(branchId)
    .first<{ id: string; user_id: string }>();

  if (!branch) return json({ error: "Branch not found." }, { status: 404 });
  if (branch.user_id !== user.id) return json({ error: "Forbidden." }, { status: 403 });

  const form = await request.formData();
  const intent = form.get("action") as string;

  if (intent === "add") {
    const username = (form.get("username") as string || "").trim().toLowerCase();
    const member = await db
      .prepare("SELECT id, username, display_name, avatar_url, bio FROM users WHERE username = ?")
      .bind(username)
      .first<UserCardData>();

    if (!member) return json({ error: "User not found." }, { status: 404 });
    if (member.id === user.id) return json({ error: "You're already the owner." }, { status: 400 });

    await db
      .prepare("INSERT OR IGNORE INTO branch_members (branch_id, user_id, invited_by) VALUES (?, ?, ?)")
      .bind(branchId, member.id, user.id)
      .run();

    return json({ success: true, member });
  }

  if (intent === "remove") {
    const userId = form.get("userId") as string;
    await db
      .prepare("DELETE FROM branch_members WHERE branch_id = ? AND user_id = ?")
      .bind(branchId, userId)
      .run();
    return json({ success: true });
  }

  return json({ error: "Unknown action." }, { status: 400 });
}
