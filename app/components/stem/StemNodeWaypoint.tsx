import type { Node } from "./types";

export function StemNodeWaypoint({
  node,
  depth,
  isMobile,
}: {
  node: Node;
  depth: number;
  isMobile?: boolean;
}) {
  const marker = depth === 0 ? "\u25C6" : depth === 1 ? "\u25C7" : "\u2500";
  const markerColor =
    depth === 0 ? "var(--forest)" : depth === 1 ? "var(--ink-mid)" : "var(--ink-light)";
  const titleSize = depth === 0 ? 15 : depth === 1 ? 14 : 13;
  const titleWeight = depth === 0 ? 700 : depth === 1 ? 600 : 500;

  return (
    <div style={s.container}>
      <div style={s.row}>
        {/* Diamond marker — sits on the stem line */}
        <div style={s.diamondWrap}>
          <div style={s.diamondBg} />
          <span style={{ ...s.diamondIcon, color: markerColor, fontSize: depth >= 2 ? 12 : 14 }}>
            {marker}
          </span>
        </div>

        {/* Emoji + title */}
        <div style={s.labelWrap}>
          {node.emoji && <span style={s.emoji}>{node.emoji}</span>}
          <span
            style={{
              ...s.title,
              fontSize: titleSize,
              fontWeight: titleWeight,
            }}
          >
            {node.title}
          </span>
        </div>

        {/* Horizontal rule */}
        {!isMobile && <div style={s.hrLine} />}
      </div>

      {/* Description */}
      {node.description && (
        <p style={s.description}>{node.description}</p>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 24,
    marginBottom: 12,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    position: "relative" as const,
  },

  // Diamond marker
  diamondWrap: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative" as const,
    zIndex: 2,
    marginLeft: -11, // centers the 22px diamond on the stem line at left: 0
    marginRight: 8,
  },
  diamondBg: {
    position: "absolute" as const,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "var(--paper)",
    zIndex: -1,
  },
  diamondIcon: {
    lineHeight: 1,
  },

  // Label
  labelWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  emoji: {
    fontSize: 16,
    flexShrink: 0,
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // Horizontal rule
  hrLine: {
    flex: 1,
    height: 1,
    background: "var(--paper-dark)",
    marginLeft: 12,
    minWidth: 40,
  },

  // Description
  description: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: "4px 0 0 19px",
    paddingLeft: 0,
  },
};
