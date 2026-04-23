import { useEffect, useState } from "react";
import type { Node } from "./types";
import { styles } from "./stem-styles";

/**
 * NodeRail renders a sticky sidebar listing every node in the stem as a nested
 * tree. It serves as the primary navigation between nodes when focused, so
 * visitors and owners can teleport around the stem without round-tripping
 * through the root.
 *
 * Responsive:
 *   - Desktop (>= 960px): always visible in-flow (wrapper supplies layout).
 *   - Mobile (< 680px): hidden in flow; wrapper should render it inside
 *     a drawer and pass `variant="drawer"` so we skip sticky positioning.
 */
export function NodeRail({
  rootNodes,
  childNodesMap,
  nodeToArtifacts,
  focusedNodeId,
  rootArtifactCount,
  onRootClick,
  onNodeClick,
  variant = "sidebar",
}: {
  rootNodes: Node[];
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  focusedNodeId: string | null;
  rootArtifactCount: number;
  onRootClick: () => void;
  onNodeClick: (nodeId: string) => void;
  variant?: "sidebar" | "drawer";
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // When a nested child becomes focused, auto-expand its ancestors.
  useEffect(() => {
    if (!focusedNodeId) return;
    const ancestors = findAncestors(focusedNodeId, rootNodes, childNodesMap);
    if (ancestors.length === 0) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) next.add(id);
      return next;
    });
  }, [focusedNodeId, rootNodes, childNodesMap]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const containerStyle: React.CSSProperties =
    variant === "drawer" ? { ...styles.nodeRail, position: "static" as const, maxHeight: "unset" } : styles.nodeRail;

  return (
    <nav aria-label="Stem navigation" style={containerStyle}>
      <div style={styles.nodeRailHeader}>
        <span>Nodes</span>
      </div>

      <button
        onClick={onRootClick}
        style={{
          ...styles.nodeRailItemRoot,
          ...(focusedNodeId === null ? styles.nodeRailItemActive : null),
        }}
      >
        <span style={styles.nodeRailEmoji}>◆</span>
        <span style={styles.nodeRailTitle}>Stem root</span>
        {rootArtifactCount > 0 && (
          <span style={styles.nodeRailCount}>{rootArtifactCount}</span>
        )}
      </button>

      {rootNodes.map((node) => (
        <RailNode
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          focusedNodeId={focusedNodeId}
          childNodesMap={childNodesMap}
          nodeToArtifacts={nodeToArtifacts}
          onToggle={toggleExpanded}
          onClick={onNodeClick}
        />
      ))}

      {rootNodes.length === 0 && (
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
          color: "var(--ink-light)", padding: "8px 10px", fontStyle: "italic",
        }}>
          No nodes yet
        </p>
      )}
    </nav>
  );
}

function RailNode({
  node,
  depth,
  expanded,
  focusedNodeId,
  childNodesMap,
  nodeToArtifacts,
  onToggle,
  onClick,
}: {
  node: Node;
  depth: number;
  expanded: Set<string>;
  focusedNodeId: string | null;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  onToggle: (nodeId: string) => void;
  onClick: (nodeId: string) => void;
}) {
  const children = childNodesMap.get(node.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isActive = focusedNodeId === node.id;
  const artifactCount = (nodeToArtifacts.get(node.id) || []).length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            style={styles.nodeRailCaret}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}
        <button
          onClick={() => onClick(node.id)}
          style={{
            ...styles.nodeRailItem,
            ...(isActive ? styles.nodeRailItemActive : null),
          }}
          data-node-drop={node.id}
          data-node-rail-item={node.id}
        >
          {node.emoji && <span style={styles.nodeRailEmoji}>{node.emoji}</span>}
          <span style={styles.nodeRailTitle}>{node.title}</span>
          {artifactCount > 0 && (
            <span style={styles.nodeRailCount}>{artifactCount}</span>
          )}
        </button>
      </div>
      {hasChildren && isExpanded && children.map((child) => (
        <RailNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expanded={expanded}
          focusedNodeId={focusedNodeId}
          childNodesMap={childNodesMap}
          nodeToArtifacts={nodeToArtifacts}
          onToggle={onToggle}
          onClick={onClick}
        />
      ))}
    </>
  );
}

function findAncestors(
  nodeId: string,
  rootNodes: Node[],
  childNodesMap: Map<string, Node[]>
): string[] {
  const parentOf = new Map<string, string>();
  const walk = (parents: Node[]) => {
    for (const p of parents) {
      const children = childNodesMap.get(p.id) || [];
      for (const c of children) {
        parentOf.set(c.id, p.id);
        walk([c]);
      }
    }
  };
  walk(rootNodes);
  const ancestors: string[] = [];
  let current = parentOf.get(nodeId);
  while (current) {
    ancestors.push(current);
    current = parentOf.get(current);
  }
  return ancestors;
}

/**
 * NodeRailDrawer — mobile bottom-sheet wrapper.
 */
export function NodeRailDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div style={styles.nodeRailDrawerBackdrop} onClick={onClose} />
      <div style={styles.nodeRailDrawer} role="dialog" aria-modal="true">
        {children}
      </div>
    </>
  );
}
