import { useRef, useEffect } from "react";
import type { Node, Artifact } from "./types";
import { NodeRow, ArtifactRow } from "./ColumnRow";

/** A positioned item in a column — either a node or an artifact. */
export interface ColumnItem {
  id: string;
  type: "node" | "artifact";
  position: number;
}

/**
 * A single column in the Finder-style browser.
 * Shows a header (for non-root columns) and a position-sorted list of node/artifact rows.
 */
export function StemColumn({
  columnNode,
  items,
  nodesById,
  artifactsById,
  childNodesMap,
  nodeToArtifacts,
  selectedNodeId,
  selectedArtifactId,
  isOwner,
  onNodeClick,
  onArtifactClick,
}: {
  columnNode: Node | null; // null = root column
  items: ColumnItem[];
  nodesById: Map<string, Node>;
  artifactsById: Map<string, Artifact>;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  selectedNodeId: string | null;
  selectedArtifactId: string | null;
  isOwner: boolean;
  onNodeClick: (nodeId: string) => void;
  onArtifactClick: (artifactId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when column node changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [columnNode?.id]);

  return (
    <div style={colStyles.column}>
      {/* Column header (non-root) */}
      {columnNode && (
        <div style={colStyles.header}>
          {columnNode.emoji && (
            <span style={colStyles.headerEmoji}>{columnNode.emoji}</span>
          )}
          <span style={colStyles.headerTitle}>{columnNode.title}</span>
          {columnNode.description && (
            <p style={colStyles.headerDesc}>{columnNode.description}</p>
          )}
        </div>
      )}

      {/* Item list */}
      <div ref={scrollRef} style={colStyles.list}>
        {items.length === 0 && (
          <p style={colStyles.empty}>
            {isOwner ? "Empty \u2014 add items with the + button" : "No items yet"}
          </p>
        )}
        {items.map((item) => {
          if (item.type === "node") {
            const node = nodesById.get(item.id);
            if (!node) return null;
            const children = childNodesMap.get(node.id) || [];
            const artifactIds = nodeToArtifacts.get(node.id) || [];
            return (
              <NodeRow
                key={item.id}
                node={node}
                childCount={children.length}
                artifactCount={artifactIds.length}
                isSelected={selectedNodeId === node.id}
                isOwner={isOwner}
                onClick={() => onNodeClick(node.id)}
              />
            );
          }

          const artifact = artifactsById.get(item.id);
          if (!artifact) return null;
          return (
            <ArtifactRow
              key={item.id}
              artifact={artifact}
              isSelected={selectedArtifactId === artifact.id}
              onClick={() => onArtifactClick(artifact.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

const colStyles: Record<string, React.CSSProperties> = {
  column: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    background: "var(--surface)",
    height: "100%",
  },

  header: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
  },
  headerEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    color: "var(--ink)",
  },
  headerDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: 0,
    marginTop: 6,
  },

  list: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
  },

  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    textAlign: "center" as const,
    padding: "40px 20px",
  },
};
