import { useState } from "react";
import type { Node, Artifact } from "./types";

export function NodeGridCard({
  node,
  childCount,
  artifactCount,
  thumbnailArtifact,
  onClick,
}: {
  node: Node;
  childCount: number;
  artifactCount: number;
  thumbnailArtifact: Artifact | null;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const totalItems = childCount + artifactCount;
  const thumbSrc = thumbnailArtifact?.image_url ?? null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...nodeStyles.card,
        ...(hovered ? nodeStyles.cardHover : {}),
      }}
    >
      {/* Thumbnail background or solid color */}
      <div style={nodeStyles.visual}>
        {thumbSrc ? (
          <>
            <img
              src={thumbSrc}
              alt=""
              style={nodeStyles.bgImage}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div style={nodeStyles.bgOverlay} />
            <span style={nodeStyles.emojiOverImage}>{node.emoji || "\uD83D\uDCC1"}</span>
          </>
        ) : (
          <span style={nodeStyles.emoji}>{node.emoji || "\uD83D\uDCC1"}</span>
        )}
      </div>

      {/* Label */}
      <div style={nodeStyles.label}>
        <span style={nodeStyles.title}>{node.title}</span>
        <div style={nodeStyles.countRow}>
          {totalItems > 0 && (
            <span style={nodeStyles.count}>
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          )}
          <span style={nodeStyles.chevron}>{"\u203A"}</span>
        </div>
      </div>
    </button>
  );
}

const nodeStyles: Record<string, React.CSSProperties> = {
  card: {
    breakInside: "avoid",
    marginBottom: 16,
    borderRadius: 12,
    border: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.15s, background 0.15s",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    padding: 0,
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
  },
  cardHover: {
    borderColor: "var(--forest)",
    background: "var(--leaf)",
  },

  // Visual area
  visual: {
    position: "relative" as const,
    width: "100%",
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--paper)",
    overflow: "hidden",
    flexShrink: 0,
  },
  bgImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    filter: "brightness(0.7) saturate(0.8)",
  },
  bgOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.15)",
  },
  emojiOverImage: {
    position: "relative" as const,
    fontSize: 28,
    zIndex: 1,
    filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))",
  },
  emoji: {
    fontSize: 28,
  },

  // Label area
  label: {
    padding: "8px 12px 10px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  countRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  count: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  chevron: {
    fontSize: 16,
    color: "var(--ink-light)",
    lineHeight: 1,
  },
};
