import { useState } from "react";
import type { Node } from "./types";
import type { Density } from "./useDensity";

/**
 * NodeCard renders a node as a branch card on the organic stem.
 * Click = dive into the node (zoom motion handled by the caller).
 *
 * The card reads as "a branch you can take": bold emoji + title, a
 * small count stripe, and a chevron that appears on hover to sell the
 * dive affordance.
 */
export function NodeCard({
  node,
  artifactCount,
  density = "airy",
  onClick,
}: {
  node: Node;
  artifactCount: number;
  density?: Density;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    ...nodeCardStyles.card,
    ...(density === "medium" ? nodeCardStyles.cardMedium : null),
    ...(density === "dense" ? nodeCardStyles.cardDense : null),
    ...(hovered ? nodeCardStyles.cardHover : null),
  };

  if (density === "dense") {
    return (
      <button
        onClick={onClick}
        style={cardStyle}
        title={`Explore ${node.title}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {node.emoji && <span style={nodeCardStyles.emojiDense}>{node.emoji}</span>}
        <span style={nodeCardStyles.titleDense}>{node.title}</span>
        <span style={nodeCardStyles.countStripe}>{artifactCount}</span>
        <span style={{ ...nodeCardStyles.chevron, opacity: hovered ? 1 : 0.3 }}>{"\u203A"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={cardStyle}
      title={`Explore ${node.title}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={nodeCardStyles.header}>
        {node.emoji && <span style={nodeCardStyles.emoji}>{node.emoji}</span>}
        <span style={nodeCardStyles.title}>{node.title}</span>
        <span style={{ ...nodeCardStyles.chevron, transform: hovered ? "translateX(2px)" : "translateX(0)" }}>
          {"\u203A"}
        </span>
      </div>
      {artifactCount > 0 && (
        <div style={nodeCardStyles.footer}>
          <span style={nodeCardStyles.countStripe}>
            {artifactCount} {artifactCount === 1 ? "artifact" : "artifacts"}
          </span>
        </div>
      )}
    </button>
  );
}

const nodeCardStyles: Record<string, React.CSSProperties> = {
  card: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "14px 18px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box" as const,
  },
  cardMedium: {
    padding: "11px 14px",
    gap: 6,
  },
  cardDense: {
    padding: "8px 12px",
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cardHover: {
    borderColor: "var(--forest)",
    boxShadow: "0 2px 10px rgba(45, 90, 61, 0.08)",
    transform: "translateY(-1px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 20,
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
    fontSize: 15,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    minWidth: 0,
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
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  countStripe: {
    display: "inline-block",
    padding: "2px 8px",
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--forest)",
    background: "rgba(45, 90, 61, 0.08)",
    borderRadius: 999,
    flexShrink: 0,
  },
  chevron: {
    fontSize: 18,
    lineHeight: 1,
    color: "var(--forest)",
    flexShrink: 0,
    transition: "transform 0.15s ease, opacity 0.15s ease",
  },
};
