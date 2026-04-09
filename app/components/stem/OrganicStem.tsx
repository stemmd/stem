import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Artifact, Node } from "./types";
import { styles } from "./stem-styles";
import { ArtifactCard } from "./ArtifactCard";
import { NodeCard } from "./NodeCard";
import { AddNodeForm } from "./AddNodeForm";
import { AddItemPopover } from "./AddItemPopover";
import { DragProvider, useDragContext } from "./DragContext";
import { FloatingAddButton } from "./FloatingAddButton";

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
}) {
  const [focusedNodeStack, setFocusedNodeStack] = useState<string[]>([]);
  const [focusedSide, setFocusedSide] = useState<"left" | "right">("right");
  const [popoverPosition, setPopoverPosition] = useState<{ y: number; index: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 680px)");

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

  // Determine which side each item goes on
  const getItemSide = useCallback(
    (item: StemItem, index: number): "left" | "right" => {
      if (item.side === 1) return "left";
      if (item.side === 2) return "right";
      return index % 2 === 0 ? "right" : "left";
    },
    []
  );

  // Handle trunk click for adding items
  const handleTrunkClick = useCallback(
    (yPosition: number, insertIndex: number) => {
      if (!isOwner) return;
      setPopoverPosition({ y: yPosition, index: insertIndex });
    },
    [isOwner]
  );

  // Focus/zoom into a node
  const focusNode = useCallback((nodeId: string, side?: "left" | "right") => {
    setFocusedNodeStack((prev) => [...prev, nodeId]);
    if (side) setFocusedSide(side);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#node-${nodeId}`);
    }
  }, []);

  const unfocusNode = useCallback(() => {
    setFocusedNodeStack((prev) => {
      const next = prev.slice(0, -1);
      if (typeof window !== "undefined") {
        const lastId = next.length > 0 ? next[next.length - 1] : null;
        window.history.replaceState(null, "", lastId ? `#node-${lastId}` : window.location.pathname);
      }
      return next;
    });
  }, []);

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

  // Empty state
  if (stemItems.length === 0 && !isOwner) {
    return (
      <p style={styles.empty}>
        No artifacts yet.
      </p>
    );
  }

  // Determine grid columns based on focus state
  const isFocused = !!focusedNode;
  const stemShiftsLeft = isFocused && focusedSide === "right";
  const gridColumns = isMobile
    ? "4px 1fr"
    : isFocused
      ? stemShiftsLeft
        ? "0.2fr 4px 1fr"   // stem shrinks left, node expands right
        : "1fr 4px 0.2fr"   // node expands left, stem shrinks right
      : "1fr 4px 1fr";

  return (
    <DragProvider stemId={stemId} items={dragItems} isOwner={isOwner}>
    <div style={organicStyles.wrapper}>
      {/* Main stem + focused node side-by-side layout */}
      <div style={{ display: "flex", gap: 0, position: "relative", transition: "all 0.3s ease" }}>

        {/* ── The stem column (shrinks when focused) ─────────────────── */}
        <div
          style={{
            flex: isFocused ? "0 0 auto" : "1 1 auto",
            width: isFocused ? (isMobile ? 0 : 80) : "100%",
            opacity: isFocused ? 0.35 : 1,
            filter: isFocused ? "blur(1px)" : "none",
            transition: "all 0.3s ease",
            overflow: "hidden",
            cursor: isFocused ? "pointer" : "default",
            order: isFocused && stemShiftsLeft ? 0 : isFocused ? 2 : 0,
          }}
          onClick={isFocused ? () => {
            setFocusedNodeStack([]);
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", window.location.pathname);
            }
          } : undefined}
          title={isFocused ? "Click to return to stem" : undefined}
        >
          <div
            ref={gridRef}
            style={{
              ...organicStyles.grid,
              gridTemplateColumns: isFocused ? "1fr 4px 1fr" : gridColumns,
              pointerEvents: isFocused ? "none" : "auto",
            }}
          >
            {stemItems.length > 0 && (
              <div
                style={{
                  ...organicStyles.trunk,
                  gridColumn: "2",
                  gridRow: `1 / ${stemItems.length + 2}`,
                }}
              />
            )}

            {stemItems.map((item, index) => (
              <StemBranchItem
                key={item.id}
                item={item}
                index={index}
                isMobile={false}
                side={getItemSide(item, index)}
                isOwner={isOwner && !isFocused}
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
        </div>

        {/* ── Focused node panel (slides in from the node's side) ──── */}
        {isFocused && focusedNode && (
          <div
            style={{
              flex: "1 1 auto",
              minWidth: 0,
              order: stemShiftsLeft ? 2 : 0,
              padding: isMobile ? "0 16px" : "0 32px",
              animation: "fadeUp 0.25s ease-out",
            }}
          >
            {/* Breadcrumb */}
            <div style={organicStyles.breadcrumb}>
              <button
                onClick={() => {
                  setFocusedNodeStack([]);
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", window.location.pathname);
                  }
                }}
                style={organicStyles.breadcrumbLink}
              >
                {"\u2190"} Stem
              </button>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} style={organicStyles.breadcrumbItem}>
                  <span style={organicStyles.breadcrumbSep}>/</span>
                  {i < breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => setFocusedNodeStack((prev) => prev.slice(0, i + 1))}
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

            {/* Mini organic trunk for this node's artifacts */}
            <div style={{ ...organicStyles.grid, gridTemplateColumns: "1fr 4px 1fr", maxWidth: 700 }}>
              {(focusedNodeArtifacts.length > 0 || focusedNodeChildren.length > 0) && (
                <div style={{
                  ...organicStyles.trunk,
                  gridColumn: "2",
                  gridRow: `1 / ${focusedNodeArtifacts.length + focusedNodeChildren.length + 2}`,
                }} />
              )}

              {focusedNodeArtifacts.map((artifact, i) => (
                <div
                  key={artifact.id}
                  style={{
                    ...organicStyles.branchItem,
                    gridColumn: i % 2 === 0 ? "2 / 4" : "1 / 3",
                    gridRow: i + 1,
                    flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                  }}
                >
                  <div style={{ ...organicStyles.connectorWrap, flexDirection: i % 2 === 0 ? "row" : "row-reverse" }}>
                    <div style={organicStyles.junctionDot} />
                    <div style={organicStyles.connector} />
                  </div>
                  <div style={organicStyles.cardWrapper}>
                    <ArtifactCard
                      artifact={artifact}
                      stemId={stemId}
                      stemUserId={stemUserId}
                      currentUserId={currentUserId}
                      stemUsername={stemUsername}
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
              ))}

              {/* Sub-nodes as clickable cards on the mini-trunk */}
              {focusedNodeChildren.map((child, i) => {
                const childArtifactCount = (nodeToArtifacts.get(child.id) || []).length;
                const rowIdx = focusedNodeArtifacts.length + i + 1;
                return (
                  <div
                    key={child.id}
                    style={{
                      ...organicStyles.branchItem,
                      gridColumn: rowIdx % 2 === 0 ? "1 / 3" : "2 / 4",
                      gridRow: rowIdx,
                      flexDirection: rowIdx % 2 === 0 ? "row-reverse" : "row",
                    }}
                  >
                    <div style={{ ...organicStyles.connectorWrap, flexDirection: rowIdx % 2 === 0 ? "row-reverse" : "row" }}>
                      <div style={organicStyles.junctionDot} />
                      <div style={organicStyles.connector} />
                    </div>
                    <NodeCard
                      node={child}
                      artifactCount={childArtifactCount}
                      onClick={() => focusNode(child.id)}
                    />
                  </div>
                );
              })}
            </div>

            {focusedNodeArtifacts.length === 0 && focusedNodeChildren.length === 0 && (
              <p style={{ ...styles.empty, padding: "40px 0" }}>No artifacts in this node yet.</p>
            )}

            {isOwner && (
              <div style={{ marginTop: 20, maxWidth: 400 }}>
                <AddNodeForm stemId={stemId} parentId={focusedNodeId} />
              </div>
            )}
          </div>
        )}
      </div>


      {/* Add item popover */}
      {popoverPosition && !isFocused && (
        <AddItemPopover
          position={popoverPosition}
          stemId={stemId}
          onClose={() => setPopoverPosition(null)}
        />
      )}

      {/* Floating add button (owner) */}
      {isOwner && (
        <FloatingAddButton
          onAdd={() => {
            const main = document.querySelector("main");
            if (main) main.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </div>
    </DragProvider>
  );
}

function StemBranchItem({
  item,
  index,
  isMobile,
  side,
  isOwner,
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
  nodesById: Map<string, Node>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  stemId: string;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  onNodeClick: (nodeId: string, side?: "left" | "right") => void;
}) {
  const drag = useDragContext();

  // Span 2 columns so the connector bridges into the trunk column
  const gridColumn = isMobile
    ? "2"
    : side === "left"
      ? "1 / 3"   // left content + trunk
      : "2 / 4";  // trunk + right content

  const dragProps = isOwner && drag
    ? {
        draggable: true,
        onDragStart: drag.onDragStart({ id: item.id, type: item.type }),
        onDragOver: drag.onDragOver(index),
        onDrop: drag.onDrop(index),
        onDragEnd: drag.onDragEnd,
      }
    : {};

  const isDragging = drag?.dragItem?.id === item.id;
  const isDragOver = drag?.dragOverIndex === index && drag?.isDragging && !isDragging;

  const content = item.type === "node"
    ? (() => {
        const node = nodesById.get(item.id);
        if (!node) return null;
        const artifactCount = (nodeToArtifacts.get(node.id) || []).length;
        return (
          <NodeCard
            node={node}
            artifactCount={artifactCount}
            onClick={() => onNodeClick(node.id, side)}
          />
        );
      })()
    : (() => {
        const artifact = artifactsById.get(item.id);
        if (!artifact) return null;
        return (
          <div style={organicStyles.cardWrapper}>
            <ArtifactCard
              artifact={artifact}
              stemId={stemId}
              stemUserId={stemUserId}
              currentUserId={currentUserId}
              stemUsername={stemUsername}
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
      {...dragProps}
      style={{
        ...organicStyles.branchItem,
        gridColumn,
        gridRow: index + 1,
        flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s",
        borderTop: isDragOver ? "2px solid var(--forest)" : "2px solid transparent",
        cursor: isOwner && drag ? (isDragging ? "grabbing" : "grab") : undefined,
      }}
    >
      {/* Connector with junction dot */}
      <div style={{ ...organicStyles.connectorWrap, flexDirection: side === "left" && !isMobile ? "row-reverse" : "row" }}>
        <div style={organicStyles.junctionDot} />
        <div style={organicStyles.connector} />
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

  grid: {
    display: "grid",
    gridAutoRows: "auto",
    gap: "28px 0",
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
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "var(--forest)",
    flexShrink: 0,
  },

  growthTip: {
    position: "absolute" as const,
    bottom: -4,
    left: "50%",
    transform: "translateX(-50%)",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--forest)",
    opacity: 0.5,
    animation: "pulse 2s ease-in-out infinite",
  },

  branchItem: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    minWidth: 0,
  },

  connector: {
    width: 40,
    height: 2,
    background: "var(--forest)",
    opacity: 0.5,
    flexShrink: 0,
    alignSelf: "center",
  },

  cardWrapper: {
    flex: 1,
    minWidth: 0,
    maxWidth: 380,
  },

  // ── Focus mode (zoomed into a node) ─────────────────────────────────────

  focusContainer: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "0 24px",
    animation: "fadeUp 0.25s ease-out",
  },

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
    flexWrap: "wrap",
  },

  breadcrumbLink: {
    background: "none",
    border: "none",
    padding: "4px 8px",
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
    padding: "4px 8px",
  },

  focusedHeader: {
    marginBottom: 40,
    textAlign: "center",
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
    marginLeft: "auto",
    marginRight: "auto",
  },

  focusedCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },

  focusedContent: {
    display: "flex",
    flexDirection: "column",
    gap: 20, // Generous spacing between artifacts
  },

  subNodes: {
    marginTop: 48,
  },

  subNodesLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 16,
    display: "block",
  },

  subNodesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },

  subNodeCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "16px 20px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },

  subNodeTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--ink)",
  },

  subNodeCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
};
