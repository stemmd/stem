import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Artifact, Node } from "./types";
import { styles } from "./stem-styles";
import { ArtifactCard } from "./ArtifactCard";
import { NodeCard } from "./NodeCard";
import { AddNodeForm } from "./AddNodeForm";
import { AddArtifactForm } from "./AddArtifactForm";
import { DragProvider, useDragContext } from "./DragContext";
import { FloatingAddButton } from "./FloatingAddButton";
import { NodeRail, NodeRailDrawer } from "./NodeRail";
import { useDensity, type Density } from "./useDensity";

/**
 * A single item on the stem — either a node or an artifact.
 * Used to create the unified, interleaved display.
 */
interface StemItem {
  id: string;
  type: "node" | "artifact";
  position: number;
  side: number; // 0 = auto, 1 = left, 2 = right
}

export function OrganicStem({
  stemId,
  childNodesMap,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  approvedNodes,
  rootNodes,
  rootArtifacts,
  stemUserId,
  stemUsername,
  currentUserId,
  isOwner,
  canContribute,
  contributionMode,
  canUpload,
}: {
  stemId: string;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  approvedNodes: Node[];
  rootNodes: Node[];
  rootArtifacts: Artifact[];
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  isOwner: boolean;
  canContribute: boolean;
  contributionMode: string;
  canUpload: boolean;
}) {
  const [focusedNodeStack, setFocusedNodeStack] = useState<string[]>([]);
  const [railDrawerOpen, setRailDrawerOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 680px)");
  const isNarrow = useMediaQuery("(max-width: 960px)");

  const totalItemCount =
    rootNodes.length + rootArtifacts.length + approvedNodes.length +
    Array.from(nodeToArtifacts.values()).reduce((sum, arr) => sum + arr.length, 0);

  const { density, override, setOverride } = useDensity(stemId, totalItemCount);
  // On mobile we default to at least `medium` density to reclaim vertical space.
  const effectiveDensity: Density = isMobile && density === "airy" ? "medium" : density;

  const focusedNodeId = focusedNodeStack.length > 0 ? focusedNodeStack[focusedNodeStack.length - 1] : null;

  // Build a unified, position-sorted list of root items (nodes + root artifacts)
  const stemItems = useMemo(() => {
    const items: StemItem[] = [];

    for (const node of rootNodes) {
      items.push({
        id: node.id,
        type: "node",
        position: node.position,
        side: node.stem_side ?? 0,
      });
    }

    for (const artifact of rootArtifacts) {
      items.push({
        id: artifact.id,
        type: "artifact",
        position: artifact.stem_position ?? 999999,
        side: artifact.stem_side ?? 0,
      });
    }

    items.sort((a, b) => a.position - b.position);
    return items;
  }, [rootNodes, rootArtifacts]);

  const getItemSide = useCallback(
    (item: StemItem, index: number): "left" | "right" => {
      if (item.side === 1) return "left";
      if (item.side === 2) return "right";
      return index % 2 === 0 ? "right" : "left";
    },
    []
  );

  // Run a state update inside a View Transition when supported.
  const runTransition = useCallback((update: () => void) => {
    if (typeof document === "undefined" || !("startViewTransition" in document)) {
      update();
      return;
    }
    (document as unknown as { startViewTransition: (cb: () => void) => void })
      .startViewTransition(update);
  }, []);

  const updateHash = useCallback((nodeId: string | null) => {
    if (typeof window === "undefined") return;
    const url = nodeId
      ? `${window.location.pathname}${window.location.search}#node-${nodeId}`
      : `${window.location.pathname}${window.location.search}`;
    // replaceState preserves scroll; back button still works from the preceding entry.
    window.history.replaceState(null, "", url);
  }, []);

  const focusNode = useCallback((nodeId: string) => {
    runTransition(() => {
      setFocusedNodeStack((prev) => {
        // If already in stack, truncate to that point; else push onto stack.
        const existingIdx = prev.indexOf(nodeId);
        const next = existingIdx >= 0 ? prev.slice(0, existingIdx + 1) : [...prev, nodeId];
        updateHash(nodeId);
        return next;
      });
    });
    setRailDrawerOpen(false);
  }, [runTransition, updateHash]);

  const jumpToNode = useCallback((nodeId: string) => {
    // Jump directly to a node from the rail — replaces the focus stack.
    runTransition(() => {
      setFocusedNodeStack([nodeId]);
      updateHash(nodeId);
    });
    setRailDrawerOpen(false);
  }, [runTransition, updateHash]);

  const unfocusToRoot = useCallback(() => {
    runTransition(() => {
      setFocusedNodeStack([]);
      updateHash(null);
    });
    setRailDrawerOpen(false);
  }, [runTransition, updateHash]);

  const unfocusOne = useCallback(() => {
    runTransition(() => {
      setFocusedNodeStack((prev) => {
        const next = prev.slice(0, -1);
        const lastId = next.length > 0 ? next[next.length - 1] : null;
        updateHash(lastId);
        return next;
      });
    });
  }, [runTransition, updateHash]);

  // Initialize from URL hash on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#node-")) {
      const nodeId = hash.slice(6);
      if (approvedNodes.some((n) => n.id === nodeId)) {
        setFocusedNodeStack([nodeId]);
      }
    }
  }, [approvedNodes]);

  // Esc handler — unfocus one level
  useEffect(() => {
    if (focusedNodeStack.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        unfocusOne();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedNodeStack.length, unfocusOne]);

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  const focusedNode = focusedNodeId ? nodesById.get(focusedNodeId) ?? null : null;
  const focusedNodeArtifacts = focusedNodeId
    ? (nodeToArtifacts.get(focusedNodeId) || [])
        .map((id) => artifactsById.get(id))
        .filter(Boolean) as Artifact[]
    : [];
  const focusedNodeChildren = focusedNodeId ? (childNodesMap.get(focusedNodeId) || []) : [];

  const breadcrumbs = useMemo(() => {
    return focusedNodeStack.map((id) => {
      const node = nodesById.get(id);
      return { id, title: node?.title ?? "", emoji: node?.emoji ?? "" };
    });
  }, [focusedNodeStack, nodesById]);

  const dragItems = useMemo(
    () => stemItems.map((item) => ({ id: item.id, type: item.type })),
    [stemItems]
  );

  // Empty state (visitor)
  if (stemItems.length === 0 && !isOwner) {
    return (
      <p style={styles.empty}>
        No artifacts yet.
      </p>
    );
  }

  const isFocused = !!focusedNode;
  const showSidebar = !isMobile && !isNarrow && rootNodes.length > 0;
  const showMobileRailButton = (isMobile || isNarrow) && rootNodes.length > 0;

  const rowGap = effectiveDensity === "dense" ? 10 : effectiveDensity === "medium" ? 16 : 28;
  const junctionDotSize = isMobile ? 6 : effectiveDensity === "dense" ? 7 : 10;
  const connectorWidth = isMobile ? 20 : effectiveDensity === "dense" ? 28 : 40;
  const cardMaxWidth = effectiveDensity === "dense" ? 300 : effectiveDensity === "medium" ? 340 : 380;

  const gridColumns = isMobile
    ? "4px 1fr"
    : "1fr 4px 1fr";

  const renderRail = (variant: "sidebar" | "drawer") => (
    <NodeRail
      rootNodes={rootNodes}
      childNodesMap={childNodesMap}
      nodeToArtifacts={nodeToArtifacts}
      focusedNodeId={focusedNodeId}
      rootArtifactCount={rootArtifacts.length}
      onRootClick={unfocusToRoot}
      onNodeClick={jumpToNode}
      variant={variant}
    />
  );

  return (
    <DragProvider stemId={stemId} items={dragItems} isOwner={isOwner}>
      <div style={organicStyles.wrapper}>

        {/* Toolbar: density toggle + mobile rail button */}
        {(isOwner || showMobileRailButton) && (
          <div style={organicStyles.toolbar}>
            {showMobileRailButton && (
              <button
                type="button"
                onClick={() => setRailDrawerOpen(true)}
                style={styles.nodeRailOpenBtn}
                aria-label="Open node list"
              >
                ☰ Nodes ({rootNodes.length})
              </button>
            )}
            {isOwner && (
              <DensityToggle
                current={override ?? density}
                auto={override === null}
                onChange={(value) => setOverride(value)}
              />
            )}
          </div>
        )}

        <div style={{
          display: showSidebar ? "grid" : "block",
          gridTemplateColumns: showSidebar ? "200px 1fr" : undefined,
          gap: showSidebar ? 32 : 0,
          alignItems: "start",
        }}>
          {showSidebar && (
            <aside style={organicStyles.sidebar}>
              {renderRail("sidebar")}
            </aside>
          )}

          <div style={organicStyles.column}>

            {/* Stem trunk view (hidden when focused) */}
            {!isFocused && (
              <div
                ref={gridRef}
                data-stem-grid
                style={{
                  ...organicStyles.grid,
                  gridTemplateColumns: gridColumns,
                  gap: `${rowGap}px 0`,
                  viewTransitionName: "stem-trunk",
                }}
              >
                {stemItems.length > 0 && (
                  <div
                    style={{
                      ...organicStyles.trunk,
                      gridColumn: isMobile ? "1" : "2",
                      gridRow: `1 / ${stemItems.length + 2}`,
                    }}
                  />
                )}

                {stemItems.map((item, index) => (
                  <StemBranchItem
                    key={item.id}
                    item={item}
                    index={index}
                    isMobile={isMobile}
                    side={getItemSide(item, index)}
                    isOwner={isOwner}
                    density={effectiveDensity}
                    junctionDotSize={junctionDotSize}
                    connectorWidth={connectorWidth}
                    cardMaxWidth={cardMaxWidth}
                    nodesById={nodesById}
                    nodeToArtifacts={nodeToArtifacts}
                    artifactsById={artifactsById}
                    artifactToNodes={artifactToNodes}
                    stemId={stemId}
                    stemUserId={stemUserId}
                    stemUsername={stemUsername}
                    currentUserId={currentUserId}
                    onNodeClick={focusNode}
                  />
                ))}

                {stemItems.length === 0 && isOwner && (
                  <div style={{ gridColumn: "1 / -1", gridRow: 1, textAlign: "center", padding: "60px 20px" }}>
                    <p style={styles.empty}>Add your first node or artifact to start growing your stem</p>
                  </div>
                )}
              </div>
            )}

            {/* Focused node panel */}
            {isFocused && focusedNode && (
              <div
                style={{
                  ...organicStyles.focusPanel,
                  viewTransitionName: "stem-focus-panel",
                  padding: isMobile ? "0 16px" : "0 32px",
                }}
              >
                {/* Back + breadcrumb */}
                <div style={organicStyles.breadcrumbRow}>
                  <button
                    type="button"
                    onClick={unfocusToRoot}
                    style={organicStyles.backBtn}
                  >
                    {"\u2190"} Back to stem
                  </button>
                  {breadcrumbs.length > 1 && (
                    <div style={organicStyles.breadcrumb}>
                      {breadcrumbs.map((crumb, i) => (
                        <span key={crumb.id} style={organicStyles.breadcrumbItem}>
                          {i > 0 && <span style={organicStyles.breadcrumbSep}>/</span>}
                          {i < breadcrumbs.length - 1 ? (
                            <button
                              onClick={() => jumpToNode(crumb.id)}
                              style={organicStyles.breadcrumbLink}
                            >
                              {crumb.emoji && `${crumb.emoji} `}{crumb.title}
                            </button>
                          ) : (
                            <span style={organicStyles.breadcrumbCurrent}>
                              {crumb.emoji && `${crumb.emoji} `}{crumb.title}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node header */}
                <div style={{ marginBottom: 32 }}>
                  {focusedNode.emoji && (
                    <span style={{ fontSize: 32, marginBottom: 8, display: "block" }}>{focusedNode.emoji}</span>
                  )}
                  <h2 style={organicStyles.focusedTitle}>{focusedNode.title}</h2>
                  {focusedNode.description && (
                    <p style={organicStyles.focusedDesc}>{focusedNode.description}</p>
                  )}
                  <span style={organicStyles.focusedCount}>
                    {focusedNodeArtifacts.length} {focusedNodeArtifacts.length === 1 ? "artifact" : "artifacts"}
                  </span>
                </div>

                {/* Mini organic trunk for this node's items */}
                <div style={{
                  ...organicStyles.grid,
                  gridTemplateColumns: isMobile ? "4px 1fr" : "1fr 4px 1fr",
                  maxWidth: 700,
                  gap: `${rowGap}px 0`,
                }}>
                  {(focusedNodeArtifacts.length > 0 || focusedNodeChildren.length > 0) && (
                    <div style={{
                      ...organicStyles.trunk,
                      gridColumn: isMobile ? "1" : "2",
                      gridRow: `1 / ${focusedNodeArtifacts.length + focusedNodeChildren.length + 2}`,
                    }} />
                  )}

                  <FocusedNodeItems
                    artifacts={focusedNodeArtifacts}
                    childNodes={focusedNodeChildren}
                    isMobile={isMobile}
                    density={effectiveDensity}
                    junctionDotSize={junctionDotSize}
                    connectorWidth={connectorWidth}
                    cardMaxWidth={cardMaxWidth}
                    stemId={stemId}
                    stemUserId={stemUserId}
                    currentUserId={currentUserId}
                    stemUsername={stemUsername}
                    focusedNodeId={focusedNodeId}
                    artifactToNodes={artifactToNodes}
                    nodeToArtifacts={nodeToArtifacts}
                    nodesById={nodesById}
                    isOwner={isOwner}
                    onNodeClick={focusNode}
                  />
                </div>

                {focusedNodeArtifacts.length === 0 && focusedNodeChildren.length === 0 && !canContribute && (
                  <p style={{ ...styles.empty, padding: "40px 0" }}>No artifacts in this node yet.</p>
                )}

                {canContribute && (
                  <div style={{ maxWidth: 640, marginTop: 24 }}>
                    <AddArtifactForm
                      stemId={stemId}
                      isOwner={isOwner}
                      stemUsername={stemUsername}
                      contributionMode={contributionMode}
                      canUpload={canUpload}
                      nodeId={focusedNodeId}
                    />
                  </div>
                )}

                {isOwner && (
                  <div style={{ marginTop: 20, maxWidth: 400 }}>
                    <AddNodeForm stemId={stemId} parentId={focusedNodeId} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating add button (owner) */}
        {isOwner && !isFocused && (
          <FloatingAddButton
            onAdd={() => {
              const main = document.querySelector("main");
              if (main) main.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {/* Mobile rail drawer */}
        <NodeRailDrawer open={railDrawerOpen} onClose={() => setRailDrawerOpen(false)}>
          {renderRail("drawer")}
        </NodeRailDrawer>

      </div>
    </DragProvider>
  );
}

/** Density toggle (airy / medium / dense). */
function DensityToggle({
  current,
  auto,
  onChange,
}: {
  current: Density;
  auto: boolean;
  onChange: (value: Density | null) => void;
}) {
  const options: { value: Density; label: string; title: string }[] = [
    { value: "airy", label: "airy", title: "Roomy spacing, large cards" },
    { value: "medium", label: "medium", title: "Balanced density" },
    { value: "dense", label: "dense", title: "Compact, one-line cards" },
  ];
  return (
    <div style={styles.densityToggleRow} title={auto ? "Density is auto — click to override" : "Density overridden — double-click a mode to reset"}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          style={{
            ...styles.densityToggleBtn,
            ...(current === opt.value ? styles.densityToggleBtnActive : null),
          }}
          title={opt.title}
          onClick={() => onChange(opt.value)}
          onDoubleClick={() => onChange(null)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Items inside a focused node — artifacts + sub-nodes on their own trunk. */
function FocusedNodeItems({
  artifacts,
  childNodes,
  isMobile,
  density,
  junctionDotSize,
  connectorWidth,
  cardMaxWidth,
  stemId,
  stemUserId,
  currentUserId,
  stemUsername,
  focusedNodeId,
  artifactToNodes,
  nodeToArtifacts,
  nodesById,
  isOwner,
  onNodeClick,
}: {
  artifacts: Artifact[];
  childNodes: Node[];
  isMobile: boolean;
  density: Density;
  junctionDotSize: number;
  connectorWidth: number;
  cardMaxWidth: number;
  stemId: string;
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
  focusedNodeId: string | null;
  artifactToNodes: Map<string, string[]>;
  nodeToArtifacts: Map<string, string[]>;
  nodesById: Map<string, Node>;
  isOwner: boolean;
  onNodeClick: (nodeId: string) => void;
}) {
  const drag = useDragContext();

  const connectorStyle: React.CSSProperties = { ...organicStyles.connector, width: connectorWidth };
  const dotStyle: React.CSSProperties = {
    ...organicStyles.junctionDot,
    width: junctionDotSize,
    height: junctionDotSize,
  };

  return (
    <>
      {artifacts.map((artifact, i) => {
        const side = isMobile ? "right" : (i % 2 === 0 ? "right" : "left");
        const gridColumn = isMobile ? "2" : (side === "right" ? "2 / 4" : "1 / 3");
        return (
          <div
            key={artifact.id}
            onPointerDown={isOwner && drag ? drag.handleArtifactDrag(artifact.id) : undefined}
            style={{
              ...organicStyles.branchItem,
              gridColumn,
              gridRow: i + 1,
              flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
              cursor: isOwner ? "grab" : undefined,
              touchAction: isOwner ? "none" : undefined,
            }}
          >
            <div style={{ ...organicStyles.connectorWrap, flexDirection: side === "left" && !isMobile ? "row-reverse" : "row" }}>
              <div style={dotStyle} />
              <div style={connectorStyle} />
            </div>
            <div style={{ ...organicStyles.cardWrapper, maxWidth: cardMaxWidth }}>
              <ArtifactCard
                artifact={artifact}
                stemId={stemId}
                stemUserId={stemUserId}
                currentUserId={currentUserId}
                stemUsername={stemUsername}
                density={density}
                nodeNames={
                  (artifactToNodes.get(artifact.id)?.length ?? 0) > 1
                    ? artifactToNodes.get(artifact.id)!
                        .filter((nid) => nid !== focusedNodeId)
                        .map((nid) => nodesById.get(nid)?.title ?? "")
                        .filter(Boolean)
                    : undefined
                }
              />
            </div>
          </div>
        );
      })}

      {childNodes.map((child, i) => {
        const childArtifactCount = (nodeToArtifacts.get(child.id) || []).length;
        const rowIdx = artifacts.length + i + 1;
        const side = isMobile ? "right" : (rowIdx % 2 === 0 ? "left" : "right");
        const gridColumn = isMobile ? "2" : (side === "right" ? "2 / 4" : "1 / 3");
        return (
          <div
            key={child.id}
            style={{
              ...organicStyles.branchItem,
              gridColumn,
              gridRow: rowIdx,
              flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
            }}
          >
            <div style={{ ...organicStyles.connectorWrap, flexDirection: side === "left" && !isMobile ? "row-reverse" : "row" }}>
              <div style={dotStyle} />
              <div style={connectorStyle} />
            </div>
            <div data-node-drop={child.id} style={{ flex: 1, minWidth: 0, maxWidth: cardMaxWidth, transition: "outline 0.15s ease, box-shadow 0.15s ease", borderRadius: 12 }}>
              <NodeCard
                node={child}
                artifactCount={childArtifactCount}
                density={density}
                onClick={() => onNodeClick(child.id)}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

function StemBranchItem({
  item,
  index,
  isMobile,
  side,
  isOwner,
  density,
  junctionDotSize,
  connectorWidth,
  cardMaxWidth,
  nodesById,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  stemId,
  stemUserId,
  stemUsername,
  currentUserId,
  onNodeClick,
}: {
  item: StemItem;
  index: number;
  isMobile: boolean;
  side: "left" | "right";
  isOwner: boolean;
  density: Density;
  junctionDotSize: number;
  connectorWidth: number;
  cardMaxWidth: number;
  nodesById: Map<string, Node>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  stemId: string;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  onNodeClick: (nodeId: string) => void;
}) {
  const drag = useDragContext();

  const gridColumn = isMobile
    ? "2"
    : side === "left"
      ? "1 / 3"
      : "2 / 4";

  const connectorStyle: React.CSSProperties = { ...organicStyles.connector, width: connectorWidth };
  const dotStyle: React.CSSProperties = {
    ...organicStyles.junctionDot,
    width: junctionDotSize,
    height: junctionDotSize,
  };

  const content = item.type === "node"
    ? (() => {
        const node = nodesById.get(item.id);
        if (!node) return null;
        const artifactCount = (nodeToArtifacts.get(node.id) || []).length;
        return (
          <div data-node-drop={node.id} style={{ flex: 1, minWidth: 0, maxWidth: cardMaxWidth, transition: "outline 0.15s ease, box-shadow 0.15s ease", borderRadius: 12 }}>
            <NodeCard
              node={node}
              artifactCount={artifactCount}
              density={density}
              onClick={() => onNodeClick(node.id)}
            />
          </div>
        );
      })()
    : (() => {
        const artifact = artifactsById.get(item.id);
        if (!artifact) return null;
        return (
          <div style={{ ...organicStyles.cardWrapper, maxWidth: cardMaxWidth }}>
            <ArtifactCard
              artifact={artifact}
              stemId={stemId}
              stemUserId={stemUserId}
              currentUserId={currentUserId}
              stemUsername={stemUsername}
              density={density}
              nodeNames={
                artifactToNodes.has(artifact.id)
                  ? artifactToNodes
                      .get(artifact.id)!
                      .map((nid) => nodesById.get(nid)?.title ?? "")
                      .filter(Boolean)
                  : undefined
              }
            />
          </div>
        );
      })();

  if (!content) return null;

  return (
    <div
      data-drag-idx={index}
      onPointerDown={isOwner && drag ? drag.handlePointerDown(index, item) : undefined}
      style={{
        ...organicStyles.branchItem,
        gridColumn,
        gridRow: index + 1,
        flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
        cursor: isOwner && drag ? "grab" : undefined,
        touchAction: isOwner ? "none" : undefined,
      }}
    >
      <div style={{ ...organicStyles.connectorWrap, flexDirection: side === "left" && !isMobile ? "row-reverse" : "row" }}>
        <div style={dotStyle} />
        <div style={connectorStyle} />
      </div>
      {content}
    </div>
  );
}

// ── useMediaQuery hook ──────────────────────────────────────────────────────

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const organicStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "relative",
    width: "100%",
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    maxWidth: 900,
    margin: "0 auto 20px",
    padding: "0 24px",
    flexWrap: "wrap",
  },

  sidebar: {
    position: "sticky",
    top: 16,
    alignSelf: "flex-start",
  },

  column: {
    minWidth: 0,
  },

  grid: {
    display: "grid",
    gridAutoRows: "auto",
    position: "relative",
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px",
    alignItems: "center",
  },

  trunk: {
    position: "relative",
    width: 4,
    minHeight: 100,
    height: "100%",
    alignSelf: "stretch",
    background: "var(--forest)",
    borderRadius: 2,
    justifySelf: "center",
    opacity: 0.8,
    cursor: "default",
    zIndex: 3,
  },

  connectorWrap: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    flexShrink: 0,
    zIndex: 4,
  },

  junctionDot: {
    borderRadius: "50%",
    background: "var(--forest)",
    flexShrink: 0,
  },

  branchItem: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    minWidth: 0,
  },

  connector: {
    height: 2,
    background: "var(--forest)",
    opacity: 0.5,
    flexShrink: 0,
    alignSelf: "center",
  },

  cardWrapper: {
    flex: 1,
    minWidth: 0,
  },

  // ── Focus panel ─────────────────────────────────────────────────────────
  focusPanel: {
    animation: "fadeUp 0.22s ease-out",
    maxWidth: 900,
    margin: "0 auto",
  },

  breadcrumbRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },

  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 999,
    background: "var(--paper-mid)",
    border: "1px solid var(--paper-dark)",
    color: "var(--ink-mid)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.15s",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
  },

  breadcrumbLink: {
    background: "none",
    border: "none",
    padding: "4px 6px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--forest)",
    cursor: "pointer",
    textDecoration: "none",
    borderRadius: 4,
  },

  breadcrumbSep: {
    color: "var(--ink-light)",
    fontSize: 13,
    margin: "0 2px",
  },

  breadcrumbItem: {
    display: "flex",
    alignItems: "center",
  },

  breadcrumbCurrent: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    fontWeight: 500,
    padding: "4px 6px",
  },

  focusedTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.2,
    marginBottom: 8,
  },

  focusedDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    marginBottom: 12,
    maxWidth: 480,
  },

  focusedCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
};
