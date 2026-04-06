import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { Node, Artifact } from "./types";
import { NodeSection } from "./NodeSection";

export function DraggableNodeList({
  nodes: nodeList,
  stemId,
  childNodesMap,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  approvedNodes,
  stemUserId,
  currentUserId,
  stemUsername,
  isOwner,
}: {
  nodes: Node[];
  stemId: string;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  approvedNodes: Node[];
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
  isOwner: boolean;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const reorderFetcher = useFetcher();

  const handleDragStart = (idx: number) => (e: React.DragEvent) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  };

  const handleDrop = (dropIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    // Reorder: move dragIdx to dropIdx position
    const reordered = [...nodeList];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    reorderFetcher.submit(
      { intent: "reorder_nodes", nodeIds: JSON.stringify(reordered.map((n) => n.id)) },
      { method: "post" }
    );
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <>
      {nodeList.map((node, idx) => (
        <div
          key={node.id}
          draggable={isOwner}
          onDragStart={isOwner ? handleDragStart(idx) : undefined}
          onDragOver={isOwner ? handleDragOver(idx) : undefined}
          onDrop={isOwner ? handleDrop(idx) : undefined}
          onDragEnd={isOwner ? handleDragEnd : undefined}
          style={{
            position: "relative",
            opacity: dragIdx === idx ? 0.4 : 1,
            transition: "opacity 0.15s",
            borderTop: overIdx === idx && dragIdx !== null && dragIdx !== idx
              ? "2px solid var(--forest)"
              : "2px solid transparent",
          }}
        >
          {isOwner && (
            <span
              style={styles.dragHandle}
              title="Drag to reorder"
            >
              ⠿
            </span>
          )}
          <NodeSection
            node={node}
            depth={0}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
            artifactsById={artifactsById}
            artifactToNodes={artifactToNodes}
            approvedNodes={approvedNodes}
            stemUserId={stemUserId}
            currentUserId={currentUserId}
            stemUsername={stemUsername}
            isOwner={isOwner}
            stemId={stemId}
          />
        </div>
      ))}
    </>
  );
}
