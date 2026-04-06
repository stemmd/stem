import { Link } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { Stem, StemCategory } from "./types";

export function StemHeader({
  stem,
  stemCategories,
  children,
}: {
  stem: Stem;
  stemCategories: StemCategory[];
  children?: React.ReactNode;
}) {
  return (
    <div style={headerStyles.container}>
      <div style={styles.stemMeta}>
        <Link to={`/${stem.username}`} style={styles.authorLink}>
          @{stem.username}
        </Link>
        {!!stem.is_branch && (
          <span style={styles.branchBadge}>Branch</span>
        )}
        {stem.visibility !== "public" && (
          <span style={styles.privateBadge}>{stem.visibility}</span>
        )}
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
