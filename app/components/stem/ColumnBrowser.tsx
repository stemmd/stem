import { useMemo, useState, useCallback, useEffect } from "react";
import type { Node, Artifact } from "./types";
import { StemColumn, type ColumnItem } from "./StemColumn";
import { ArtifactDetailPanel } from "./ArtifactDetailPanel";
import { MobileBreadcrumb } from "./MobileBreadcrumb";
import { NodeRow, ArtifactRow } from "./ColumnRow";
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

  const getColumnItems = useCallback(
    (parentNodeId: string | null): ColumnItem[] => {
      const items: ColumnItem[] = [];
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

  const columns = useMemo(() => {
    const cols: { nodeId: string | null; node: Node | null; items: ColumnItem[] }[] = [];
    cols.push({ nodeId: null, node: null, items: getColumnItems(null) });
    for (const nodeId of openPath) {
      const node = nodesById.get(nodeId) ?? null;
      cols.push({ nodeId, node, items: getColumnItems(nodeId) });
    }
    return cols;
  }, [openPath, getColumnItems, nodesById]);

  const handleNodeClick = useCallback((nodeId: string, columnIndex: number) => {
    setSelectedArtifactId(null);
    setOpenPath((prev) => {
      const newPath = prev.slice(0, columnIndex);
      newPath.push(nodeId);
      return newPath;
    });
  }, []);

  const handleArtifactClick = useCallback((artifactId: string) => {
    setSelectedArtifactId((prev) => (prev === artifactId ? null : artifactId));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedArtifactId(null);
  }, []);

  // URL hash sync
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastNode = openPath.length > 0 ? openPath[openPath.length - 1] : null;
    if (lastNode) {
      window.history.replaceState(null, "", `#node-${lastNode}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [openPath]);

  const selectedArtifact = selectedArtifactId ? artifactsById.get(selectedArtifactId) ?? null : null;

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

  // ── Stats for root overview ──────────────────────────────────
  const totalArtifacts = artifactsById.size;
  const totalNodes = approvedNodes.length;

  // ── Mobile ───────────────────────────────────────────────────

  if (isMobile) {
    const currentColumnIndex = openPath.length;
    const currentColumn = columns[currentColumnIndex] || columns[columns.length - 1];
    const selectedNodeInColumn = currentColumnIndex < openPath.length ? openPath[currentColumnIndex] : null;

    return (
      <div style={bStyles.mobileWrapper}>
        <MobileBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNav} />
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

  // ── Desktop ──────────────────────────────────────────────────
  //
  // Three states:
  // 1. Root overview (no node selected, no artifact open)
  // 2. Browsing nodes (sidebar + active column)
  // 3. Viewing artifact (sidebar + full-tab artifact viewer)

  const isAtRoot = openPath.length === 0;
  const parentColumn = isAtRoot ? null : columns[columns.length - 2] || null;
  const activeColumn = columns[columns.length - 1];
  const activeColumnIndex = columns.length - 1;
  const parentColumnIndex = columns.length - 2;

  // ── State 3: Artifact viewer takes over ──────────────────────
  if (selectedArtifact) {
    // Sidebar shows the current column (where the artifact was clicked)
    const sidebarColumn = activeColumn;
    const sidebarColumnIndex = activeColumnIndex;

    return (
      <div style={bStyles.wrapper}>
        {openPath.length > 0 && (
          <div style={bStyles.breadcrumbBar}>
            <MobileBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNav} />
          </div>
        )}
        <div style={bStyles.body}>
          {/* Sidebar: shows the list where the artifact lives */}
          <div style={bStyles.sidebar}>
            <StemColumn
              columnNode={sidebarColumn.node}
              items={sidebarColumn.items}
              nodesById={nodesById}
              artifactsById={artifactsById}
              childNodesMap={childNodesMap}
              nodeToArtifacts={nodeToArtifacts}
              selectedNodeId={null}
              selectedArtifactId={selectedArtifactId}
              isOwner={isOwner}
              onNodeClick={(nodeId) => handleNodeClick(nodeId, sidebarColumnIndex)}
              onArtifactClick={handleArtifactClick}
            />
          </div>

          {/* Artifact viewer: takes over all remaining space */}
          <div style={bStyles.viewerArea}>
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
        </div>
      </div>
    );
  }

  // ── State 1: Root overview ───────────────────────────────────
  if (isAtRoot) {
    const rootItems = getColumnItems(null);
    const nodeItems = rootItems.filter((i) => i.type === "node");
    const artifactItems = rootItems.filter((i) => i.type === "artifact");

    return (
      <div style={bStyles.wrapper}>
        <div style={bStyles.rootOverview}>
          {/* Stats */}
          <div style={bStyles.rootStats}>
            {totalNodes > 0 && (
              <span style={bStyles.rootStat}>
                <span style={bStyles.rootStatNum}>{totalNodes}</span>
                <span style={bStyles.rootStatLabel}>{totalNodes === 1 ? "node" : "nodes"}</span>
              </span>
            )}
            <span style={bStyles.rootStat}>
              <span style={bStyles.rootStatNum}>{totalArtifacts}</span>
              <span style={bStyles.rootStatLabel}>{totalArtifacts === 1 ? "artifact" : "artifacts"}</span>
            </span>
          </div>

          {/* Nodes as cards */}
          {nodeItems.length > 0 && (
            <div style={bStyles.rootNodeGrid}>
              {nodeItems.map((item) => {
                const node = nodesById.get(item.id);
                if (!node) return null;
                const children = childNodesMap.get(node.id) || [];
                const artifactIds = nodeToArtifacts.get(node.id) || [];
                const count = children.length + artifactIds.length;
                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node.id, 0)}
                    style={bStyles.rootNodeCard}
                  >
                    <span style={bStyles.rootNodeEmoji}>{node.emoji || "\uD83D\uDCC1"}</span>
                    <span style={bStyles.rootNodeTitle}>{node.title}</span>
                    {node.description && (
                      <span style={bStyles.rootNodeDesc}>{node.description}</span>
                    )}
                    <span style={bStyles.rootNodeCount}>
                      {count} {count === 1 ? "item" : "items"} {"\u203A"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Root artifacts below */}
          {artifactItems.length > 0 && (
            <div style={bStyles.rootArtifacts}>
              {nodeItems.length > 0 && (
                <p style={bStyles.rootArtifactsLabel}>
                  {artifactItems.length} {artifactItems.length === 1 ? "artifact" : "artifacts"} at root
                </p>
              )}
              {artifactItems.map((item) => {
                const artifact = artifactsById.get(item.id);
                if (!artifact) return null;
                return (
                  <ArtifactRow
                    key={item.id}
                    artifact={artifact}
                    isSelected={false}
                    onClick={() => handleArtifactClick(artifact.id)}
                  />
                );
              })}
            </div>
          )}

          {rootItems.length === 0 && (
            <p style={bStyles.rootEmpty}>
              {isOwner ? "Your stem is empty \u2014 add nodes or artifacts with the + button" : "Nothing here yet"}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── State 2: Browsing nodes (sidebar + active column) ────────
  return (
    <div style={bStyles.wrapper}>
      {openPath.length > 0 && (
        <div style={bStyles.breadcrumbBar}>
          <MobileBreadcrumb breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbNav} />
        </div>
      )}
      <div style={bStyles.body}>
        {parentColumn && (
          <div style={bStyles.sidebar}>
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
        <div style={bStyles.mainColumn}>
          <StemColumn
            columnNode={activeColumn.node}
            items={activeColumn.items}
            nodesById={nodesById}
            artifactsById={artifactsById}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
            selectedNodeId={activeColumnIndex < openPath.length ? openPath[activeColumnIndex] : null}
            selectedArtifactId={null}
            isOwner={isOwner}
            onNodeClick={(nodeId) => handleNodeClick(nodeId, activeColumnIndex)}
            onArtifactClick={handleArtifactClick}
          />
        </div>
      </div>
    </div>
  );
}

const bStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--surface)",
    minHeight: 520,
    height: "calc(100vh - 200px)",
    maxHeight: 1000,
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
  sidebar: {
    width: 280,
    minWidth: 240,
    flexShrink: 0,
    borderRight: "1px solid var(--paper-dark)",
    overflow: "hidden",
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  viewerArea: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  // ── Root overview ────────────────────────────────────────────
  rootOverview: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "40px 48px",
  },
  rootStats: {
    display: "flex",
    gap: 32,
    marginBottom: 36,
  },
  rootStat: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  rootStatNum: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "var(--ink)",
    lineHeight: 1,
  },
  rootStatLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
  },
  rootNodeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 40,
  },
  rootNodeCard: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    padding: "20px 24px",
    background: "var(--paper)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 14,
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  rootNodeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  rootNodeTitle: {
    fontWeight: 600,
    fontSize: 16,
    color: "var(--ink)",
    lineHeight: 1.3,
  },
  rootNodeDesc: {
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  rootNodeCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 4,
  },
  rootArtifacts: {
    borderTop: "1px solid var(--paper-dark)",
    paddingTop: 24,
  },
  rootArtifactsLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    margin: 0,
    marginBottom: 12,
  },
  rootEmpty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-light)",
    textAlign: "center" as const,
    padding: "80px 20px",
  },

  // ── Mobile ───────────────────────────────────────────────────
  mobileWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 400,
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--surface)",
    height: "calc(100vh - 200px)",
  },
};
