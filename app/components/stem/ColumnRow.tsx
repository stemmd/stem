import type { Node, Artifact } from "./types";
import { getDomain } from "~/lib/utils";
import { artifactTypeLabel } from "./ArtifactCard";

/**
 * A single row in a stem column. Two variants:
 * - Node row: emoji + title + child/artifact count + chevron
 * - Artifact row: type emoji + title + domain + favicon
 */

export function NodeRow({
  node,
  childCount,
  artifactCount,
  isSelected,
  isOwner,
  onClick,
}: {
  node: Node;
  childCount: number;
  artifactCount: number;
  isSelected: boolean;
  isOwner: boolean;
  onClick: () => void;
}) {
  const totalChildren = childCount + artifactCount;

  return (
    <button
      onClick={onClick}
      style={{
        ...rowStyles.base,
        ...rowStyles.nodeRow,
        ...(isSelected ? rowStyles.nodeRowSelected : {}),
      }}
      title={node.description || undefined}
    >
      <span style={rowStyles.nodeEmoji}>{node.emoji || "\uD83D\uDCC1"}</span>
      <span style={rowStyles.nodeTitle}>{node.title}</span>
      <span style={rowStyles.nodeCount}>
        {totalChildren > 0 ? totalChildren : ""}
      </span>
      <span style={rowStyles.chevron}>{"\u203A"}</span>
    </button>
  );
}

export function ArtifactRow({
  artifact,
  isSelected,
  onClick,
}: {
  artifact: Artifact;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isNote = artifact.source_type === "note";
  const isFile = !!artifact.file_key;
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);
  const title = artifact.title || artifact.url || "Untitled";

  return (
    <button
      onClick={onClick}
      style={{
        ...rowStyles.base,
        ...rowStyles.artifactRow,
        ...(isSelected ? rowStyles.artifactRowSelected : {}),
      }}
    >
      {artifact.favicon_url ? (
        <img
          src={artifact.favicon_url}
          alt=""
          style={rowStyles.favicon}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span style={rowStyles.typeEmoji}>{typeInfo.emoji}</span>
      )}
      <div style={rowStyles.artifactInfo}>
        <span style={rowStyles.artifactTitle}>{title}</span>
        {(domain || isNote || isFile) && (
          <span style={rowStyles.artifactMeta}>
            {isNote ? "Note" : isFile ? typeInfo.label : domain}
          </span>
        )}
      </div>
    </button>
  );
}

const rowStyles: Record<string, React.CSSProperties> = {
  base: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    padding: "14px 24px",
    border: "none",
    borderBottom: "1px solid var(--paper-dark)",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink)",
    transition: "background 0.12s ease",
  },

  // Node variant
  nodeRow: {
    fontWeight: 500,
  },
  nodeRowSelected: {
    background: "var(--leaf)",
    borderLeft: "3px solid var(--forest)",
    paddingLeft: 21,
  },
  nodeEmoji: {
    fontSize: 18,
    flexShrink: 0,
    width: 26,
    textAlign: "center" as const,
  },
  nodeTitle: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  nodeCount: {
    fontSize: 12,
    color: "var(--ink-light)",
    fontFamily: "'DM Mono', monospace",
    flexShrink: 0,
  },
  chevron: {
    fontSize: 18,
    color: "var(--ink-light)",
    flexShrink: 0,
    lineHeight: 1,
  },

  // Artifact variant
  artifactRow: {
    fontWeight: 400,
  },
  artifactRowSelected: {
    background: "var(--paper-mid)",
  },
  favicon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    flexShrink: 0,
    objectFit: "cover" as const,
  },
  typeEmoji: {
    fontSize: 16,
    flexShrink: 0,
    width: 26,
    textAlign: "center" as const,
  },
  artifactInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  artifactTitle: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    lineHeight: 1.3,
  },
  artifactMeta: {
    fontSize: 11,
    color: "var(--ink-light)",
    fontFamily: "'DM Mono', monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
};
