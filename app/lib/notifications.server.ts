import { nanoid } from "nanoid";

type NotificationType =
  | "new_follower"
  | "new_find"
  | "find_approved"
  | "stem_followed";

interface CreateNotificationParams {
  db: D1Database;
  userId: string;
  type: NotificationType;
  actorId: string;
  stemId?: string | null;
  findId?: string | null;
}

export async function createNotification({
  db,
  userId,
  type,
  actorId,
  stemId,
  findId,
}: CreateNotificationParams): Promise<void> {
  // Don't notify yourself
  if (userId === actorId) return;

  const id = `ntf_${nanoid(10)}`;
  await db
    .prepare(
      "INSERT INTO notifications (id, user_id, type, actor_id, stem_id, find_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(id, userId, type, actorId, stemId ?? null, findId ?? null)
    .run();
}

export async function getUnreadCount(
  db: D1Database,
  userId: string
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0")
    .bind(userId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export interface NotificationRow {
  id: string;
  type: string;
  actor_id: string;
  stem_id: string | null;
  find_id: string | null;
  read: number;
  created_at: string;
  actor_username: string;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
  stem_title: string | null;
  stem_slug: string | null;
  stem_owner_username: string | null;
  find_title: string | null;
}

export async function getNotifications(
  db: D1Database,
  userId: string,
  limit = 50,
  before?: string | null
): Promise<NotificationRow[]> {
  let query = `
    SELECT n.id, n.type, n.actor_id, n.stem_id, n.find_id, n.read, n.created_at,
           a.username as actor_username, a.display_name as actor_display_name, a.avatar_url as actor_avatar_url,
           s.title as stem_title, s.slug as stem_slug,
           su.username as stem_owner_username,
           f.title as find_title
    FROM notifications n
    JOIN users a ON a.id = n.actor_id
    LEFT JOIN stems s ON s.id = n.stem_id
    LEFT JOIN users su ON su.id = s.user_id
    LEFT JOIN finds f ON f.id = n.find_id
    WHERE n.user_id = ?
  `;
  const bindings: string[] = [userId];

  if (before) {
    query += " AND n.created_at < ?";
    bindings.push(before);
  }

  query += " ORDER BY n.created_at DESC LIMIT ?";
  bindings.push(String(limit));

  const { results } = await db
    .prepare(query)
    .bind(...bindings)
    .all<NotificationRow>();

  return results;
}

export async function markAllRead(
  db: D1Database,
  userId: string
): Promise<void> {
  await db
    .prepare("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0")
    .bind(userId)
    .run();
}
