import { Link } from "@remix-run/react";

export type Visibility = "public" | "mutuals" | "private";

interface StemCardProps {
  to: string;
  title: string;
  emoji?: string;
  description?: string | null;
  artifactCount: number;
  visibility?: Visibility;
  username?: string;
  showAuthor?: boolean;
  categoryTint?: string;
}

export function StemCard({
  to,
  title,
  emoji,
  description,
  artifactCount,
  visibility = "public",
  username,
  showAuthor = false,
  categoryTint,
}: StemCardProps) {
  return (
    <Link to={to} style={{ ...styles.card, background: categoryTint || "var(--surface)" }}>
      {emoji && <span style={styles.emoji}>{emoji}</span>}
      <h3 style={styles.title}>{title}</h3>
      {description && <p style={styles.desc}>{description}</p>}
      <div style={styles.footer}>
        {showAuthor && username && (
          <span style={styles.author}>@{username}</span>
        )}
        <span style={styles.artifacts}>
          {visibility !== "public" && (
            <span style={styles.visBadge}>{visibility}</span>
          )}
          {artifactCount} {artifactCount === 1 ? "artifact" : "artifacts"}
        </span>
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    textDecoration: "none",
    color: "inherit",
    transition: "border-color 0.15s",
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.3,
  },
  desc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    flex: 1,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    gap: 8,
  },
  author: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  artifacts: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  emoji: {
    fontSize: 28,
    lineHeight: 1,
    display: "block",
    marginBottom: 4,
  },
  visBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    background: "var(--paper-mid)",
    padding: "1px 6px",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
  },
};
