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
  const [openPath, setOpenPath] = useState<string[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
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
        const children = childNodesMap.get(parentNodeId) || [];
        for (const node of children) {
          items.push({ id: node.id, type: "node", position: node.position });
        }
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

  // All columns: root + one per openPath entry
  const columns = useMemo(() => {
    const cols: { nodeId: string | null; node: Node | null; items: ColumnItem[] }[] = [];
    cols.push({ nodeId: null, node: null, items: getColumnItems(null) });
    for (const nodeId of openPath) {
      const node = nodesById.get(nodeId) ?? null;
      cols.push({ nodeId, node, items: getColumnItems(nodeId) });
    }
    return cols;
  }, [openPath, getColumnItems, nodesById]);

  const handleNodeClick = useCallback(
    (nodeId: string, columnIndex: number) => {
      setSelectedArtifactId(null);
      setOpenPath((prev) => {
        const newPath = prev.slice(0, columnIndex);
        newPath.push(nodeId);
        return newPath;
      });
    },
    []
  );

  const handleArtifactClick = useCallback(
    (artifactId: string) => {
      setSelectedArtifactId((prev) => (prev === artifactId ? null : artifactId));
    },
    []
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedArtifactId(null);
  }, []);

  // Initialize from URL hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#node-")) {
      const nodeId = hash.slice(6);
      if (nodesById.has(nodeId)) {
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

  // Breadcrumb path (used by both mobile and desktop)
  const breadcrumbs = useMemo(() => {
    return openPath.map((id) => {
      const node = nodesById.get(id);
      return { id, title: node?.title ?? "", emoji: node?.emoji ?? "" };
    });
  }, [openPath, nodesById]);

  const handleBreadcrumbNav = useCallback((index: number) => {
    setOpenPath((prev) => prev.slice(0, index + 1));
    setSelectedArtifactId(null);
  }, []);

  // ── Mobile: single-column drill-down ─────────────────────────────

  if (isMobile) {
    const currentColumnIndex = openPath.length;
    const currentColumn = columns[currentColumnIndex] || columns[columns.length - 1];
    const selectedNodeInColumn =
      currentColumnIndex < openPath.length ? openPath[currentColumnIndex] : null;

    return (
      <div style={browserStyles.mobileWrapper}>
        <MobileBreadcrumb
          breadcrumbs={breadcrumbs}
          onNavigate={handleBreadcrumbNav}
        />
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

  // ── Desktop: sidebar + main column + detail panel ────────────────
  //
  // Layout:
  //   - If at root (no node selected): single full-width column
  //   - If navigated deeper: narrow parent sidebar on the left,
  //     active column fills the remaining width
  //   - If an artifact is selected: detail panel takes the right half
  //
  // The key idea: only 2 columns visible max (parent + active).
  // Breadcrumbs handle the rest of the path.

  const isAtRoot = openPath.length === 0;
  const parentColumn = isAtRoot ? null : columns[columns.length - 2] || null;
  const activeColumn = columns[columns.length - 1];
  const activeColumnIndex = columns.length - 1;
  const parentColumnIndex = columns.length - 2;

  return (
    <div style={browserStyles.wrapper}>
      {/* Breadcrumb bar (visible when navigated deeper than 1 level) */}
      {openPath.length > 0 && (
        <div style={browserStyles.breadcrumbBar}>
          <MobileBreadcrumb
            breadcrumbs={breadcrumbs}
            onNavigate={handleBreadcrumbNav}
          />
        </div>
      )}

      <div style={browserStyles.body}>
        {/* Parent sidebar — narrow, shows context of where you came from */}
        {parentColumn && (
          <div style={browserStyles.sidebar}>
            <StemColumn
              columnNode={parentColumn.node}
              items={parentColumn.items}
              nodesById={nodesById}
              artifactsById={artifactsById}
              childNodesMap={childNodesMap}
              nodeToArtifacts={nodeToArtifacts}
              selectedNodeId={parentColumnIndex < openPath.length ? openPath[parentColumnIndex] : null}
              selectedArtifactId={null}
              isOwner={isOwner}
              onNodeClick={(nodeId) => handleNodeClick(nodeId, parentColumnIndex)}
              onArtifactClick={handleArtifactClick}
            />
          </div>
        )}

        {/* Active column — the main content area */}
        <div style={{
          ...browserStyles.mainColumn,
          ...(selectedArtifact ? browserStyles.mainColumnWithDetail : {}),
        }}>
          <StemColumn
            columnNode={activeColumn.node}
            items={activeColumn.items}
            nodesById={nodesById}
            artifactsById={artifactsById}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
            selectedNodeId={activeColumnIndex < openPath.length ? openPath[activeColumnIndex] : null}
            selectedArtifactId={selectedArtifactId}
            isOwner={isOwner}
            onNodeClick={(nodeId) => handleNodeClick(nodeId, activeColumnIndex)}
            onArtifactClick={handleArtifactClick}
          />
        </div>

        {/* Detail panel — generous right panel */}
        {selectedArtifact && (
          <div style={browserStyles.detailColumn}>
            <ArtifactDetailPanel
              artifact={selectedArtifact}
              stemId={stemId}
              stemUserId={stemUserId}
              stemUsername={stemUsername}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const browserStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--surface)",
    minHeight: 520,
    height: "calc(100vh - 260px)",
    maxHeight: 900,
  },
  breadcrumbBar: {
    borderBottom: "1px solid var(--paper-dark)",
    flexShrink: 0,
  },
  body: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  },

  // Narrow parent sidebar
  sidebar: {
    width: 260,
    minWidth: 220,
    flexShrink: 0,
    borderRight: "1px solid var(--paper-dark)",
    overflow: "hidden",
  },

  // Main active column — fills available space
  mainColumn: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  mainColumnWithDetail: {
    // Shrink main column when detail is open
    flex: "0 0 50%",
    maxWidth: "50%",
  },

  // Detail panel — generous right half
  detailColumn: {
    flex: 1,
    minWidth: 0,
    borderLeft: "1px solid var(--paper-dark)",
    overflow: "hidden",
  },

  mobileWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 400,
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--surface)",
  },
};
