import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

const ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const form = await request.formData();
  const file = form.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({ error: "File must be an image (WebP, JPEG, PNG, or GIF)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "File must be under 2 MB." }, { status: 400 });
  }

  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  const ext = extMap[file.type] ?? "webp";
  // Fixed key per user — overwrites previous avatar, saving storage
  const key = `avatars/${user.id}/avatar.${ext}`;

  const { DB: db, AVATAR_BUCKET: bucket, AVATAR_BUCKET_URL: bucketUrl } = context.cloudflare.env;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  // Cache-bust so browsers fetch the new file even though the path is the same
  const publicUrl = `${bucketUrl}/${key}?v=${Date.now()}`;

  await db
    .prepare("UPDATE users SET avatar_url = ? WHERE id = ?")
    .bind(publicUrl, user.id)
    .run();

  return json({ url: publicUrl });
}
