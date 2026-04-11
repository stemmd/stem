import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Node, Artifact } from "./types";
import { ArtifactGridCard } from "./ArtifactGridCard";
import { NodeGridCard } from "./NodeGridCard";
import { ArtifactDetailPanel } from "./ArtifactDetailPanel";
import { MobileBreadcrumb } from "./MobileBreadcrumb";
import { useMediaQuery } from "~/lib/hooks";

interface GridItem {
  id: string;
  type: "node" | "artifact";
  position: number;
}

export function StemGrid({
  stemId,
  rootNodes,
  rootArtifacts,
  approvedNodes,
  childNodesMap,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  stemUserId,
  stemUsername,
  currentUserId,
  isOwner,
  canContribute,
  contributionMode,
  canUpload,
  onNodeChange,
}: {
  stemId: string;
  rootNodes: Node[];
  rootArtifacts: Artifact[];
  approvedNodes: Node[];
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  isOwner: boolean;
  canContribute: boolean;
  contributionMode: string;
  canUpload: boolean;
  onNodeChange?: (nodeId: string | null) => void;
}) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodePath, setNodePath] = useState<string[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 680px)");
  const gridRef = useRef<HTMLDivElement>(null);

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  // Notify parent of node changes
  useEffect(() => {
    onNodeChange?.(currentNodeId);
  }, [currentNodeId, onNodeChange]);

  // ── Build items for current view ──────────────────────────────
  const getGridItems = useCallback(
    (parentNodeId: string | null): GridItem[] => {
      const items: GridItem[] = [];
      if (parentNodeId === null) {
        for (const node of rootNodes) {
          items.push({ id: node.id, type: "node", position: node.position });
        }
        for (const artifact of rootArtifacts) {
          items.push({ id: artifact.id, type: "artifact", position: artifact.stem_position ?? 999999 });
        }
      } else {
        const children = childNodesMap.get(parentNodeId) || [];
        for (const node of children) {
          items.push({ id: node.id, type: "node", position: node.position });
        }
        const artifactIds = nodeToArtifacts.get(parentNodeId) || [];
        for (const [i, aid] of artifactIds.entries()) {
          const artifact = artifactsById.get(aid);
          if (artifact) {
            items.push({ id: aid, type: "artifact", position: artifact.stem_position ?? 1000 + i });
          }
        }
      }
      items.sort((a, b) => a.position - b.position);
      return items;
    },
    [rootNodes, rootArtifacts, childNodesMap, nodeToArtifacts, artifactsById]
  );

  const items = useMemo(() => getGridItems(currentNodeId), [getGridItems, currentNodeId]);

  // ── Find first artifact with image for node thumbnails ────────
  const getNodeThumbnail = useCallback(
    (nodeId: string): Artifact | null => {
      const artifactIds = nodeToArtifacts.get(nodeId) || [];
      for (const aid of artifactIds) {
        const a = artifactsById.get(aid);
        if (a?.image_url) return a;
      }
      return null;
    },
    [nodeToArtifacts, artifactsById]
  );

  // ── Navigation handlers ───────────────────────────────────────
  const handleNodeClick = useCallback((nodeId: string) => {
    setCurrentNodeId(nodeId);
    setNodePath((prev) => [...prev, nodeId]);
    setSelectedArtifactId(null);
  }, []);

  const handleBreadcrumbNav = useCallback(
    (index: number) => {
      if (index === -1) {
        // Root
        setCurrentNodeId(null);
        setNodePath([]);
      } else {
        const newPath = nodePath.slice(0, index + 1);
        setCurrentNodeId(newPath[newPath.length - 1]);
        setNodePath(newPath);
      }
      setSelectedArtifactId(null);
    },
    [nodePath]
  );

  const handleBack = useCallback(() => {
    if (nodePath.length <= 1) {
      setCurrentNodeId(null);
      setNodePath([]);
    } else {
      const newPath = nodePath.slice(0, -1);
      setCurrentNodeId(newPath[newPath.length - 1]);
      setNodePath(newPath);
    }
    setSelectedArtifactId(null);
  }, [nodePath]);

  const handleArtifactClick = useCallback((artifactId: string) => {
    setSelectedArtifactId(artifactId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedArtifactId(null);
  }, []);

  // ── Scroll to top on node change ──────────────────────────────
  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentNodeId]);

  // ── URL hash sync ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#node-")) {
      const nodeId = hash.slice(6);
      if (nodesById.has(nodeId)) {
        // Build path from root to this node
        const path: string[] = [];
        let current: string | null = nodeId;
        while (current) {
          path.unshift(current);
          const node = nodesById.get(current);
          current = node?.parent_id ?? null;
        }
        setNodePath(path);
        setCurrentNodeId(nodeId);
      }
    }
  }, [nodesById]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentNodeId) {
      window.history.replaceState(null, "", `#node-${currentNodeId}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [currentNodeId]);

  // ── Escape key to close modal ─────────────────────────────────
  useEffect(() => {
    if (!selectedArtifactId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedArtifactId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedArtifactId]);

  // ── Derived data ──────────────────────────────────────────────
  const currentNode = currentNodeId ? nodesById.get(currentNodeId) ?? null : null;
  const selectedArtifact = selectedArtifactId ? artifactsById.get(selectedArtifactId) ?? null : null;

  const breadcrumbs = useMemo(() => {
    return nodePath.map((id) => {
      const node = nodesById.get(id);
      return { id, title: node?.title ?? "", emoji: node?.emoji ?? "" };
    });
  }, [nodePath, nodesById]);

  const totalArtifacts = artifactsById.size;
  const totalNodes = approvedNodes.length;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={gridStyles.wrapper}>
      {/* Breadcrumb (shown when inside a node) */}
      {currentNodeId && (
        <MobileBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNav} />
      )}

      {/* Node header */}
      {currentNode && (
        <div style={gridStyles.nodeHeader}>
          <button onClick={handleBack} style={gridStyles.backBtn} title="Go back">
            {"\u2190"}
          </button>
          {currentNode.emoji && <span style={gridStyles.nodeEmoji}>{currentNode.emoji}</span>}
          <div style={gridStyles.nodeHeaderText}>
            <span style={gridStyles.nodeTitle}>{currentNode.title}</span>
            {currentNode.description && (
              <p style={gridStyles.nodeDesc}>{currentNode.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Stats line at root */}
      {!currentNodeId && (totalNodes > 0 || totalArtifacts > 0) && (
        <div style={gridStyles.statsBar}>
          {totalNodes > 0 && (
            <span style={gridStyles.stat}>
              {totalNodes} {totalNodes === 1 ? "node" : "nodes"}
            </span>
          )}
          {totalNodes > 0 && totalArtifacts > 0 && (
            <span style={gridStyles.statDot}>{"\u00B7"}</span>
          )}
          <span style={gridStyles.stat}>
            {totalArtifacts} {totalArtifacts === 1 ? "artifact" : "artifacts"}
          </span>
        </div>
      )}

      {/* Masonry grid */}
      <div
        ref={gridRef}
        style={{
          ...gridStyles.grid,
          ...(isMobile ? gridStyles.gridMobile : {}),
        }}
      >
        {items.length === 0 && (
          <p style={gridStyles.empty}>
            {isOwner ? "Empty \u2014 add items with the + button" : "Nothing here yet"}
          </p>
        )}
        {items.map((item) => {
          if (item.type === "node") {
            const node = nodesById.get(item.id);
            if (!node) return null;
            const children = childNodesMap.get(node.id) || [];
            const artifactIds = nodeToArtifacts.get(node.id) || [];
            return (
              <NodeGridCard
                key={item.id}
                node={node}
                childCount={children.length}
                artifactCount={artifactIds.length}
                thumbnailArtifact={getNodeThumbnail(node.id)}
                onClick={() => handleNodeClick(node.id)}
              />
            );
          }

          const artifact = artifactsById.get(item.id);
          if (!artifact) return null;
          return (
            <ArtifactGridCard
              key={item.id}
              artifact={artifact}
              onClick={() => handleArtifactClick(artifact.id)}
            />
          );
        })}
      </div>

      {/* Artifact detail modal */}
      {selectedArtifact && (
        <div
          style={gridStyles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
        >
          <div style={isMobile ? gridStyles.modalMobile : gridStyles.modal}>
            <ArtifactDetailPanel
              artifact={selectedArtifact}
              stemId={stemId}
              stemUserId={stemUserId}
              stemUsername={stemUsername}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onClose={handleCloseDetail}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const gridStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--surface)",
    minHeight: 400,
  },

  // ── Node header ─────────────────────────────────────────────
  nodeHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 24px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "var(--ink-mid)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    lineHeight: 1,
    flexShrink: 0,
  },
  nodeEmoji: {
    fontSize: 24,
    flexShrink: 0,
  },
  nodeHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  nodeTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    color: "var(--ink)",
  },
  nodeDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: 0,
    marginTop: 4,
  },

  // ── Stats bar ───────────────────────────────────────────────
  statsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 24px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
  },
  stat: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  statDot: {
    color: "var(--ink-light)",
    fontSize: 12,
  },

  // ── Masonry grid ────────────────────────────────────────────
  grid: {
    columnWidth: 260,
    columnGap: 16,
    padding: "20px 24px",
    flex: 1,
  },
  gridMobile: {
    columnWidth: undefined,
    columnCount: 2,
    columnGap: 12,
    padding: "16px",
  },

  // ── Empty state ─────────────────────────────────────────────
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    textAlign: "center" as const,
    padding: "60px 20px",
    columnSpan: "all" as const,
  },

  // ── Modal overlay ───────────────────────────────────────────
  modalBackdrop: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: 640,
    maxWidth: "90vw",
    maxHeight: "85vh",
    background: "var(--surface)",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column" as const,
  },
  modalMobile: {
    width: "100%",
    height: "100%",
    background: "var(--surface)",
    borderRadius: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
};
