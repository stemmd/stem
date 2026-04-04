import { Link } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";

export interface UserCardData {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function UserCard({
  person,
  isFollowing,
  currentUserId,
}: {
  person: UserCardData;
  isFollowing: boolean;
  currentUserId: string | null;
}) {
  const fetcher = useFetcher();
  const optimisticFollowing = fetcher.formData
    ? fetcher.formData.get("action") === "follow"
    : isFollowing;

  const initials = (person.display_name || person.username).slice(0, 2).toUpperCase();
  const isSelf = currentUserId === person.id;

  return (
    <div style={styles.card}>
      <Link to={`/${person.username}`} style={styles.avatarLink}>
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" style={styles.avatar} />
        ) : (
          <span style={styles.initials}>{initials}</span>
        )}
      </Link>

      <div style={styles.info}>
        <Link to={`/${person.username}`} style={styles.name}>
          {person.display_name || person.username}
        </Link>
        <p style={styles.username}>@{person.username}</p>
        {person.bio && <p style={styles.bio}>{person.bio}</p>}
      </div>

      {currentUserId && !isSelf && (
        <fetcher.Form method="post" action={`/api/users/${person.id}/follow`} style={{ flexShrink: 0 }}>
          <input type="hidden" name="action" value={optimisticFollowing ? "unfollow" : "follow"} />
          <button
            type="submit"
            style={{
              ...styles.followBtn,
              background: optimisticFollowing ? "var(--forest)" : "transparent",
              color: optimisticFollowing ? "#fff" : "var(--forest)",
            }}
          >
            {optimisticFollowing ? "Following" : "Follow"}
          </button>
        </fetcher.Form>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 0",
    borderBottom: "1px solid var(--paper-dark)",
  },
  avatarLink: { flexShrink: 0, textDecoration: "none" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    objectFit: "cover" as const,
  },
  initials: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "var(--paper-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Serif Display', serif",
    fontSize: 16,
    color: "var(--ink-mid)",
  },
  info: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    color: "var(--ink)",
    textDecoration: "none",
    display: "block",
  },
  username: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 1,
  },
  bio: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    marginTop: 3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  followBtn: {
    padding: "6px 16px",
    border: "1px solid var(--forest)",
    borderRadius: 16,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
