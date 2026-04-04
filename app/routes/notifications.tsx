import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { requireUser } from "~/lib/auth.server";
import {
  getNotifications,
  markAllRead,
  type NotificationRow,
} from "~/lib/notifications.server";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { formatRelative } from "~/lib/utils";

export const meta: MetaFunction = () => [{ title: "Notifications — Stem" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");

  const notifications = await getNotifications(db, user.id, 50, before);

  // Mark all as read when viewing
  await markAllRead(db, user.id);

  return json({ user, notifications, unreadCount: 0 });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  await markAllRead(db, user.id);
  return json({ success: true });
}

function notificationText(n: NotificationRow): { text: string; href: string } {
  const actor = n.actor_display_name || `@${n.actor_username}`;

  switch (n.type) {
    case "new_follower":
      return {
        text: `${actor} followed you`,
        href: `/${n.actor_username}`,
      };
    case "stem_followed":
      return {
        text: `${actor} followed ${n.stem_title ?? "your stem"}`,
        href: n.stem_owner_username && n.stem_slug
          ? `/${n.stem_owner_username}/${n.stem_slug}`
          : `/${n.actor_username}`,
      };
    case "new_find":
      return {
        text: `${actor} added a find to ${n.stem_title ?? "your stem"}`,
        href: n.stem_owner_username && n.stem_slug
          ? `/${n.stem_owner_username}/${n.stem_slug}`
          : "/feed",
      };
    case "find_approved":
      return {
        text: `Your find${n.find_title ? ` "${n.find_title}"` : ""} was approved in ${n.stem_title ?? "a stem"}`,
        href: n.stem_owner_username && n.stem_slug
          ? `/${n.stem_owner_username}/${n.stem_slug}`
          : "/feed",
      };
    default:
      return { text: "New notification", href: "/feed" };
  }
}

export default function Notifications() {
  const { user, notifications } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <Nav user={user} />

      <main style={styles.main}>
        <h1 style={styles.heading}>Notifications</h1>

        {notifications.length === 0 ? (
          <p style={styles.empty}>Nothing here yet. Go explore some stems.</p>
        ) : (
          <div style={styles.list}>
            {notifications.map((n) => {
              const { text, href } = notificationText(n);
              return (
                <Link key={n.id} to={href} style={{
                  ...styles.item,
                  background: n.read ? "transparent" : "var(--leaf)",
                }}>
                  <div style={styles.itemContent}>
                    <span style={styles.avatar}>
                      {n.actor_avatar_url ? (
                        <img
                          src={n.actor_avatar_url}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={styles.avatarFallback}>
                          {n.actor_username[0]?.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div style={styles.itemText}>
                      <p style={styles.itemMessage}>{text}</p>
                      <p style={styles.itemTime}>{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                  {!n.read && <span style={styles.dot} />}
                </Link>
              );
            })}

            {notifications.length >= 50 && (
              <Link
                to={`/notifications?before=${notifications[notifications.length - 1].created_at}`}
                style={styles.loadMore}
              >
                Load older
              </Link>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    maxWidth: 600,
    width: "100%",
    margin: "0 auto",
    padding: "32px 20px",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 24,
  },
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-light)",
    textAlign: "center",
    padding: "60px 0",
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderRadius: 10,
    textDecoration: "none",
    transition: "background 0.12s",
  },
  itemContent: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    flexShrink: 0,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--paper-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "var(--ink-mid)",
    fontWeight: 500,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemMessage: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.4,
  },
  itemTime: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--forest)",
    flexShrink: 0,
    marginLeft: 8,
  },
  loadMore: {
    display: "block",
    textAlign: "center" as const,
    padding: "16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--forest)",
    fontWeight: 500,
    textDecoration: "none",
  },
};
