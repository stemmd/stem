import { Link } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { Stem, StemCategory } from "./types";

export function StemHeader({
  stem,
  stemCategories,
  isOwner,
  onSettingsClick,
  children,
}: {
  stem: Stem;
  stemCategories: StemCategory[];
  isOwner?: boolean;
  onSettingsClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={headerStyles.container}>
      {/* Top row: @username on left, gear on right */}
      <div style={headerStyles.topRow}>
        <Link to={`/${stem.username}`} style={styles.authorLink}>
          @{stem.username}
        </Link>
        <div style={headerStyles.topRowRight}>
          {!!stem.is_branch && (
            <span style={styles.branchBadge}>Branch</span>
          )}
          {stem.visibility !== "public" && (
            <span style={styles.privateBadge}>{stem.visibility}</span>
          )}
          {isOwner && onSettingsClick && (
            <button
              type="button"
              onClick={onSettingsClick}
              style={headerStyles.gearBtn}
              title="Stem settings"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.5 1.5L6.9 3.1C6.3 3.4 5.8 3.7 5.3 4.2L3.7 3.6L2.2 6.2L3.5 7.3C3.5 7.5 3.4 7.8 3.4 8C3.4 8.2 3.5 8.5 3.5 8.7L2.2 9.8L3.7 12.4L5.3 11.8C5.8 12.3 6.3 12.6 6.9 12.9L6.5 14.5H9.5L9.1 12.9C9.7 12.6 10.2 12.3 10.7 11.8L12.3 12.4L13.8 9.8L12.5 8.7C12.5 8.5 12.6 8.2 12.6 8C12.6 7.8 12.5 7.5 12.5 7.3L13.8 6.2L12.3 3.6L10.7 4.2C10.2 3.7 9.7 3.4 9.1 3.1L9.5 1.5H6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {stem.emoji && <span style={headerStyles.emoji}>{stem.emoji}</span>}
      <h1 style={headerStyles.title}>{stem.title}</h1>

      {stem.description && (
        <p style={headerStyles.desc}>{stem.description}</p>
      )}

      {stemCategories.length > 0 && (
        <div style={styles.stemCatRow}>
          {stemCategories.map((cat) => (
            <span key={cat.id} style={styles.stemCatPill}>
              {cat.emoji} {cat.name}
            </span>
          ))}
        </div>
      )}

      {children && (
        <div style={styles.stemActions}>{children}</div>
      )}
    </div>
  );
}

const headerStyles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: "center",
    marginBottom: 40,
    maxWidth: 640,
    marginLeft: "auto",
    marginRight: "auto",
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  topRowRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  gearBtn: {
    background: "none",
    border: "none",
    padding: 6,
    cursor: "pointer",
    color: "var(--ink-light)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
  },
  emoji: {
    fontSize: 48,
    lineHeight: 1,
    display: "block",
    marginBottom: 12,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.2,
    marginBottom: 12,
  },
  desc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    marginBottom: 20,
    maxWidth: 520,
    marginLeft: "auto",
    marginRight: "auto",
  },
};
