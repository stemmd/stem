import type { Node } from "./types";

/**
 * NodeCard renders a node as a compact card on the organic stem.
 * Clicking it triggers the zoom-in focus mode.
 */
export function NodeCard({
  node,
  artifactCount,
  onClick,
  dropHint,
}: {
  node: Node;
  artifactCount: number;
  onClick: () => void;
  dropHint?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={nodeCardStyles.card}
      title={`Explore ${node.title}`}
    >
      <div style={nodeCardStyles.header}>
        {node.emoji && <span style={nodeCardStyles.emoji}>{node.emoji}</span>}
        <span style={nodeCardStyles.title}>{node.title}</span>
      </div>
      <div style={nodeCardStyles.footer}>
        <span style={nodeCardStyles.count}>
          {artifactCount} {artifactCount === 1 ? "artifact" : "artifacts"}
        </span>
        <span style={nodeCardStyles.arrow}>{"\u2192"}</span>
      </div>
    </button>
  );
}

const nodeCardStyles: Record<string, React.CSSProperties> = {
  card: {
    flex: 1,
    minWidth: 0,
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "14px 18px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 20,
    flexShrink: 0,
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
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  arrow: {
    fontSize: 14,
    color: "var(--forest)",
    opacity: 0.6,
  },
};
