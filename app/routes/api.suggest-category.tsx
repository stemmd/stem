import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";
import { nanoid } from "nanoid";

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  const form = await request.formData();

  const name = (form.get("name") as string | null)?.trim();
  const emoji = (form.get("emoji") as string | null)?.trim() || null;

  if (!name || name.length < 2 || name.length > 40) {
    return json({ error: "Category name must be 2-40 characters." }, { status: 400 });
  }

  // Check if this category already exists
  const existing = await db
    .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
    .bind(name)
    .first();
  if (existing) {
    return json({ error: "This category already exists." }, { status: 400 });
  }

  // Check for duplicate pending suggestion
  const pendingDupe = await db
    .prepare("SELECT id FROM category_suggestions WHERE LOWER(name) = LOWER(?) AND status = 'pending'")
    .bind(name)
    .first();
  if (pendingDupe) {
    return json({ error: "This category has already been suggested." }, { status: 400 });
  }

  const id = `csug_${nanoid(10)}`;
  await db
    .prepare("INSERT INTO category_suggestions (id, name, emoji, suggested_by) VALUES (?, ?, ?, ?)")
    .bind(id, name, emoji, user.id)
    .run();

  return json({ success: true });
}
