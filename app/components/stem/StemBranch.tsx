import { useMemo } from "react";
import type { Node, Artifact } from "./types";
import { StemNodeWaypoint } from "./StemNodeWaypoint";
import { StemArtifactCard } from "./StemArtifactCard";

const STEM_WIDTH = 2;
const INDENT_PX = 32;
const INDENT_MOBILE = 20;
const CONNECTOR_LEN = 20;
const CONNECTOR_MOBILE = 12;

interface BranchItem {
  id: string;
  type: "node" | "artifact";
  position: number;
}

export function StemBranch({
  node,
  depth,
  childNodesMap,
  nodeToArtifacts,
  artifactsById,
  onArtifactClick,
  isMobile,
  isLast,
}: {
  node: Node;
  depth: number;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  onArtifactClick: (artifactId: string) => void;
  isMobile: boolean;
  isLast: boolean;
}) {
  const indent = isMobile ? INDENT_MOBILE : INDENT_PX;
  const connectorLen = isMobile ? CONNECTOR_MOBILE : CONNECTOR_LEN;

  // Build interleaved list of artifacts + child nodes, sorted by position
  const items = useMemo((): BranchItem[] => {
    const list: BranchItem[] = [];

    const childNodes = childNodesMap.get(node.id) || [];
    for (const child of childNodes) {
      list.push({ id: child.id, type: "node", position: child.position });
    }

    const artifactIds = nodeToArtifacts.get(node.id) || [];
    for (const [i, aid] of artifactIds.entries()) {
      const artifact = artifactsById.get(aid);
      if (artifact) {
        list.push({ id: aid, type: "artifact", position: artifact.stem_position ?? 1000 + i });
      }
    }

    list.sort((a, b) => a.position - b.position);
    return list;
  }, [node.id, childNodesMap, nodeToArtifacts, artifactsById]);

  const childNodes = childNodesMap.get(node.id) || [];

  return (
    <div
      style={{
        position: "relative" as const,
        marginLeft: depth > 0 ? indent : 0,
      }}
    >
      {/* Stem line for this branch — runs the full height */}
      <div
        style={{
          position: "absolute" as const,
          left: 0,
          top: 0,
          bottom: isLast ? "50%" : 0,
          width: STEM_WIDTH,
          background: "var(--paper-dark)",
        }}
      />

      {/* Node waypoint header */}
      <StemNodeWaypoint node={node} depth={depth} isMobile={isMobile} />

      {/* Branch contents */}
      <div style={{ paddingLeft: connectorLen + 8 }}>
        {items.map((item, idx) => {
          if (item.type === "node") {
            const childNode = childNodesMap.get(node.id)?.find((n) => n.id === item.id);
            if (!childNode) return null;
            const childIdx = childNodes.filter((n) =>
              items.findIndex((it) => it.id === n.id) <= items.findIndex((it) => it.id === item.id)
            ).length;
            const isLastItem = idx === items.length - 1;
            return (
              <StemBranch
                key={item.id}
                node={childNode}
                depth={Math.min(depth + 1, 2)}
                childNodesMap={childNodesMap}
                nodeToArtifacts={nodeToArtifacts}
                artifactsById={artifactsById}
                onArtifactClick={onArtifactClick}
                isMobile={isMobile}
                isLast={isLastItem}
              />
            );
          }

          // Artifact
          const artifact = artifactsById.get(item.id);
          if (!artifact) return null;
          return (
            <div
              key={item.id}
              style={{
                position: "relative" as const,
                marginBottom: 16,
              }}
            >
              {/* Connector line */}
              <div
                style={{
                  position: "absolute" as const,
                  left: -(connectorLen + 8),
                  top: 24,
                  width: connectorLen,
                  height: STEM_WIDTH,
                  background: "var(--paper-dark)",
                }}
              />
              <StemArtifactCard
                artifact={artifact}
                onClick={() => onArtifactClick(artifact.id)}
                isMobile={isMobile}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
