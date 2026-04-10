import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Node, Artifact } from "./types";
import { StemColumn, type ColumnItem } from "./StemColumn";
import { ArtifactDetailPanel } from "./ArtifactDetailPanel";
import { MobileBreadcrumb } from "./MobileBreadcrumb";
import { useMediaQuery } from "~/lib/hooks";

export function ColumnBrowser({
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
}) {
  // Navigation path: array of selected node IDs (empty = root only)
  const [openPath, setOpenPath] = useState<string[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 680px)");

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  // Build column items for a given parent (null = root)
  const getColumnItems = useCallback(
    (parentNodeId: string | null): ColumnItem[] => {
      const items: ColumnItem[] = [];

      if (parentNodeId === null) {
        // Root level: root nodes + root artifacts, sorted by position
        for (const node of rootNodes) {
          items.push({ id: node.id, type: "node", position: node.position });
        }
        for (const artifact of rootArtifacts) {
          items.push({
            id: artifact.id,
            type: "artifact",
            position: artifact.stem_position ?? 999999,
          });
        }
      } else {
        // Child nodes of this parent
        const children = childNodesMap.get(parentNodeId) || [];
        for (const node of children) {
          items.push({ id: node.id, type: "node", position: node.position });
        }
        // Artifacts assigned to this node
        const artifactIds = nodeToArtifacts.get(parentNodeId) || [];
        for (const [i, aid] of artifactIds.entries()) {
          const artifact = artifactsById.get(aid);
          if (artifact) {
            items.push({
              id: aid,
              type: "artifact",
              position: artifact.stem_position ?? 1000 + i,
            });
          }
        }
      }

      items.sort((a, b) => a.position - b.position);
      return items;
    },
    [rootNodes, rootArtifacts, childNodesMap, nodeToArtifacts, artifactsById]
  );

  // The columns to render: root + one for each node in openPath
  const columns = useMemo(() => {
    const cols: { nodeId: string | null; node: Node | null; items: ColumnItem[] }[] = [];

    // Root column
    cols.push({
      nodeId: null,
      node: null,
      items: getColumnItems(null),
    });

    // One column per selected node in the path
    for (const nodeId of openPath) {
      const node = nodesById.get(nodeId) ?? null;
      cols.push({
        nodeId,
        node,
        items: getColumnItems(nodeId),
      });
    }

    return cols;
  }, [openPath, getColumnItems, nodesById]);

  // When a node is clicked in a column
  const handleNodeClick = useCallback(
    (nodeId: string, columnIndex: number) => {
      setSelectedArtifactId(null);
      setOpenPath((prev) => {
        // If clicking in column N, truncate path to N entries then append
        const newPath = prev.slice(0, columnIndex);
        newPath.push(nodeId);
        return newPath;
      });
    },
    []
  );

  // When an artifact is clicked
  const handleArtifactClick = useCallback(
    (artifactId: string) => {
      setSelectedArtifactId((prev) => (prev === artifactId ? null : artifactId));
    },
    []
  );

  // Close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedArtifactId(null);
  }, []);

  // Auto-scroll right when a new column opens
  useEffect(() => {
    if (!scrollContainerRef.current || isMobile) return;
    const el = scrollContainerRef.current;
    requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    });
  }, [openPath.length, isMobile]);

  // Initialize from URL hash
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
        setOpenPath(path);
      }
    }
  }, [nodesById]);

  // Update URL hash on navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastNode = openPath.length > 0 ? openPath[openPath.length - 1] : null;
    if (lastNode) {
      window.history.replaceState(null, "", `#node-${lastNode}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [openPath]);

  const selectedArtifact = selectedArtifactId
    ? artifactsById.get(selectedArtifactId) ?? null
    : null;

  // Mobile: navigate back via breadcrumb
  const handleBreadcrumbNav = useCallback((index: number) => {
    // index -1 = go to root, otherwise truncate to that depth
    setOpenPath((prev) => prev.slice(0, index + 1));
    setSelectedArtifactId(null);
  }, []);

  // ── Mobile: single-column drill-down ─────────────────────────────

  if (isMobile) {
    const currentColumnIndex = openPath.length;
    const currentColumn = columns[currentColumnIndex] || columns[columns.length - 1];
    const selectedNodeInColumn =
      currentColumnIndex < openPath.length ? openPath[currentColumnIndex] : null;

    // Build breadcrumb path
    const breadcrumbs = openPath.map((id) => {
      const node = nodesById.get(id);
      return { id, title: node?.title ?? "", emoji: node?.emoji ?? "" };
    });

    return (
      <div style={browserStyles.mobileWrapper}>
        <MobileBreadcrumb
          breadcrumbs={breadcrumbs}
          onNavigate={handleBreadcrumbNav}
        />

        {/* If artifact detail is open, show it full-screen */}
        {selectedArtifact ? (
          <ArtifactDetailPanel
            artifact={selectedArtifact}
            stemId={stemId}
            stemUserId={stemUserId}
            stemUsername={stemUsername}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onClose={handleCloseDetail}
            isMobile
          />
        ) : (
          <StemColumn
            columnNode={currentColumn.node}
            items={currentColumn.items}
            nodesById={nodesById}
            artifactsById={artifactsById}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
            selectedNodeId={selectedNodeInColumn}
            selectedArtifactId={null}
            isOwner={isOwner}
            onNodeClick={(nodeId) => handleNodeClick(nodeId, currentColumnIndex)}
            onArtifactClick={handleArtifactClick}
          />
        )}
      </div>
    );
  }

  // ── Desktop: multi-column Finder layout ──────────────────────────

  return (
    <div style={browserStyles.wrapper}>
      <div ref={scrollContainerRef} style={browserStyles.columnsContainer}>
        {columns.map((col, i) => (
          <StemColumn
            key={col.nodeId ?? "root"}
            columnNode={col.node}
            items={col.items}
            nodesById={nodesById}
            artifactsById={artifactsById}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
            selectedNodeId={i < openPath.length ? openPath[i] : null}
            selectedArtifactId={selectedArtifactId}
            isOwner={isOwner}
            onNodeClick={(nodeId) => handleNodeClick(nodeId, i)}
            onArtifactClick={handleArtifactClick}
          />
        ))}
      </div>

      {/* Detail panel slides in on the right */}
      {selectedArtifact && (
        <ArtifactDetailPanel
          artifact={selectedArtifact}
          stemId={stemId}
          stemUserId={stemUserId}
          stemUsername={stemUsername}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

const browserStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
    overflow: "hidden",
    background: "var(--surface)",
    minHeight: 400,
    maxHeight: "calc(100vh - 300px)",
  },
  columnsContainer: {
    display: "flex",
    flex: 1,
    overflowX: "auto" as const,
    overflowY: "hidden" as const,
  },
  mobileWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 300,
  },
};
