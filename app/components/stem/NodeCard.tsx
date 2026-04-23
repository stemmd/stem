import { useState } from "react";
import type { Node } from "./types";
import type { Density } from "./useDensity";

/** A tiny preview entry for the hover-peek. */
export interface NodePreviewItem {
  id: string;
  type: "node" | "artifact";
  title: string;
  icon: string; // emoji for the node, type emoji for the artifact
}

/**
 * NodeCard renders a node as a branch card. It carries a bit more
 * weight than an artifact card (branches are thicker than leaves):
 * title, optional description, a breakdown of what's inside, and a
 * subtle hover "peek" that unfurls a glimpse of the first few
 * contents — like grazing a leaf to reveal the fruit behind it.
 *
 * Click toggles the full inline expansion.
 */
export function NodeCard({
  node,
  artifactCount,
  subNodeCount = 0,
  previewItems = [],
  density = "airy",
  expanded = false,
  onClick,
}: {
  node: Node;
  artifactCount: number;
  subNodeCount?: number;
  previewItems?: NodePreviewItem[];
  density?: Density;
  expanded?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    ...nodeCardStyles.card,
    ...(density === "medium" ? nodeCardStyles.cardMedium : null),
    ...(density === "dense" ? nodeCardStyles.cardDense : null),
    ...(hovered || expanded ? nodeCardStyles.cardHover : null),
    ...(expanded ? nodeCardStyles.cardExpanded : null),
  };

  const chevron = expanded ? "\u25BE" : "\u25B8"; // ▾ / ▸
  const showPeek = hovered && !expanded && previewItems.length > 0 && density !== "dense";

  // "2 articles · 1 sub-topic" style summary
  const countParts: string[] = [];
  if (artifactCount > 0) {
    countParts.push(`${artifactCount} ${artifactCount === 1 ? "artifact" : "artifacts"}`);
  }
  if (subNodeCount > 0) {
    countParts.push(`${subNodeCount} sub-${subNodeCount === 1 ? "topic" : "topics"}`);
  }
  const countLine = countParts.length > 0 ? countParts.join(" · ") : "Empty";

  if (density === "dense") {
    return (
      <button
        onClick={onClick}
        style={cardStyle}
        title={expanded ? `Collapse ${node.title}` : `Expand ${node.title}`}
        aria-expanded={expanded}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={nodeCardStyles.chevronDense}>{chevron}</span>
        {node.emoji && <span style={nodeCardStyles.emojiDense}>{node.emoji}</span>}
        <span style={nodeCardStyles.titleDense}>{node.title}</span>
        {(artifactCount + subNodeCount) > 0 && (
          <span style={nodeCardStyles.countStripe}>{artifactCount + subNodeCount}</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={cardStyle}
      title={expanded ? `Collapse ${node.title}` : `Expand ${node.title}`}
      aria-expanded={expanded}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={nodeCardStyles.header}>
        <span style={nodeCardStyles.chevron}>{chevron}</span>
        {node.emoji && <span style={nodeCardStyles.emoji}>{node.emoji}</span>}
        <span style={nodeCardStyles.title}>{node.title}</span>
      </div>

      {node.description && (
        <p style={nodeCardStyles.description}>{node.description}</p>
      )}

      <div style={nodeCardStyles.footer}>
        <span style={nodeCardStyles.countStripe}>{countLine}</span>
      </div>

      {/* Hover peek: gentle unfurl revealing the first few contents */}
      <div
        style={{
          ...nodeCardStyles.peek,
          maxHeight: showPeek ? 200 : 0,
          opacity: showPeek ? 1 : 0,
          marginTop: showPeek ? 10 : 0,
        }}
        aria-hidden="true"
      >
        <div style={nodeCardStyles.peekDivider} />
        {previewItems.map((item) => (
          <div key={item.id} style={nodeCardStyles.peekItem}>
            <span style={nodeCardStyles.peekIcon}>{item.icon}</span>
            <span style={nodeCardStyles.peekTitle}>{item.title}</span>
          </div>
        ))}
        {artifactCount + subNodeCount > previewItems.length && (
          <div style={nodeCardStyles.peekMore}>
            +{artifactCount + subNodeCount - previewItems.length} more
          </div>
        )}
      </div>
    </button>
  );
}

const nodeCardStyles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "16px 20px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 14,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.2s ease",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box" as const,
    overflow: "hidden",
  },
  cardMedium: {
    padding: "12px 16px",
    gap: 5,
  },
  cardDense: {
    padding: "8px 12px",
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cardHover: {
    borderColor: "var(--forest)",
    boxShadow: "0 4px 18px rgba(45, 90, 61, 0.12)",
    transform: "translateY(-1px)",
  },
  cardExpanded: {
    boxShadow: "inset 0 -2px 0 var(--forest)",
    borderColor: "var(--forest)",
    transform: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 22,
    flexShrink: 0,
    lineHeight: 1,
  },
  emojiDense: {
    fontSize: 14,
    flexShrink: 0,
    lineHeight: 1,
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
    letterSpacing: "-0.005em",
  },
  titleDense: {
    fontWeight: 600,
    fontSize: 13,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    fontStyle: "italic" as const,
    lineHeight: 1.5,
    margin: 0,
    paddingLeft: 22, // roughly aligns with title (past chevron)
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: 22,
  },
  countStripe: {
    display: "inline-block",
    padding: "2px 9px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--forest)",
    background: "rgba(45, 90, 61, 0.1)",
    borderRadius: 999,
    flexShrink: 0,
    letterSpacing: "0.01em",
  },
  chevron: {
    fontSize: 11,
    lineHeight: 1,
    color: "var(--forest)",
    flexShrink: 0,
    width: 12,
    display: "inline-flex",
    justifyContent: "center",
    transition: "transform 0.2s ease",
  },
  chevronDense: {
    fontSize: 10,
    lineHeight: 1,
    color: "var(--forest)",
    flexShrink: 0,
    width: 10,
    display: "inline-flex",
    justifyContent: "center",
  },

  // ── Hover peek ────────────────────────────────────────────────────────
  peek: {
    overflow: "hidden" as const,
    transition: "max-height 0.28s ease-out, opacity 0.22s ease-out, margin-top 0.28s ease-out",
    paddingLeft: 22,
  },
  peekDivider: {
    height: 1,
    background: "var(--leaf-border)",
    marginBottom: 8,
    opacity: 0.6,
  },
  peekItem: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "3px 0",
    minHeight: 0,
  },
  peekIcon: {
    fontSize: 12,
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.8,
  },
  peekTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-mid)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
  },
  peekMore: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    paddingTop: 4,
    fontStyle: "italic" as const,
  },
};
