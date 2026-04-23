import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import type { Artifact, Node } from "./types";
import { styles } from "./stem-styles";
import { ArtifactCard, artifactTypeLabel } from "./ArtifactCard";
import { NodeCard, type NodePreviewItem } from "./NodeCard";
import { AddNodeForm } from "./AddNodeForm";
import { AddArtifactForm } from "./AddArtifactForm";
import { DragProvider, useDragContext } from "./DragContext";
import { FloatingAddButton } from "./FloatingAddButton";
import { useDensity, type Density } from "./useDensity";

/** Build a small hover-preview list of the first few items inside a node. */
function buildNodePreview(
  nodeId: string,
  childNodesMap: Map<string, Node[]>,
  nodeToArtifacts: Map<string, string[]>,
  artifactsById: Map<string, Artifact>,
  nodesById: Map<string, Node>,
  limit = 3,
): NodePreviewItem[] {
  const entries: { id: string; type: "node" | "artifact"; position: number }[] = [];
  for (const child of childNodesMap.get(nodeId) || []) {
    entries.push({ id: child.id, type: "node", position: child.position });
  }
  for (const artId of nodeToArtifacts.get(nodeId) || []) {
    const a = artifactsById.get(artId);
    if (!a) continue;
    entries.push({ id: artId, type: "artifact", position: a.stem_position ?? 999999 });
  }
  entries.sort((a, b) => a.position - b.position);
  return entries.slice(0, limit).map((e) => {
    if (e.type === "node") {
      const n = nodesById.get(e.id)!;
      return { id: e.id, type: "node" as const, title: n.title, icon: n.emoji || "\u25C6" };
    }
    const a = artifactsById.get(e.id)!;
    const info = artifactTypeLabel(a.source_type);
    return {
      id: e.id,
      type: "artifact" as const,
      title: a.title || a.url || "Untitled",
      icon: info.emoji,
    };
  });
}

/**
 * A single item on a stem level — either a node or an artifact.
 */
interface StemItem {
  id: string;
  type: "node" | "artifact";
  position: number;
  side: number; // 0 = auto, 1 = left, 2 = right
}

/**
 * OrganicStem is the stem surface. Navigation is inline: the main
 * trunk is always visible; clicking a node card expands its contents
 * directly beneath the card, connected to the trunk by a small
 * sub-branch. Sub-nodes expand the same way, recursively. There's
 * no focus mode and no separate page.
 */
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
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const isMobile = useMediaQuery("(max-width: 680px)");

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  const totalItemCount =
    rootNodes.length + rootArtifacts.length + approvedNodes.length +
    Array.from(nodeToArtifacts.values()).reduce((sum, arr) => sum + arr.length, 0);

  const { density, override, setOverride } = useDensity(stemId, totalItemCount);
  const effectiveDensity: Density = isMobile && density === "airy" ? "medium" : density;

  // Build root-level items (nodes + loose artifacts, interleaved by position)
  const rootStemItems = useMemo(() => {
    const items: StemItem[] = [];
    for (const node of rootNodes) {
      items.push({ id: node.id, type: "node", position: node.position, side: node.stem_side ?? 0 });
    }
    for (const artifact of rootArtifacts) {
      items.push({
        id: artifact.id, type: "artifact",
        position: artifact.stem_position ?? 999999,
        side: artifact.stem_side ?? 0,
      });
    }
    items.sort((a, b) => a.position - b.position);
    return items;
  }, [rootNodes, rootArtifacts]);

  const dragItems = useMemo(
    () => rootStemItems.map((item) => ({ id: item.id, type: item.type })),
    [rootStemItems]
  );

  // ── Expand/collapse ────────────────────────────────────────────────────
  const toggleExpand = useCallback((nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // On mount, auto-expand the path to a #node-xyz hash (if any) and scroll to it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#node-")) return;
    const target = hash.slice(6);
    if (!nodesById.has(target)) return;
    const toExpand = new Set<string>();
    let cursor: Node | undefined = nodesById.get(target);
    while (cursor) {
      toExpand.add(cursor.id);
      cursor = cursor.parent_id ? nodesById.get(cursor.parent_id) : undefined;
    }
    setExpanded(toExpand);
    // Let the DOM settle before scrolling to the expanded anchor.
    setTimeout(() => {
      const anchor = document.querySelector(`[data-node-anchor="${target}"]`);
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [nodesById]);

  // ── Layout params ──────────────────────────────────────────────────────
  const useTrunk = rootStemItems.length >= 4;
  const rowGap = effectiveDensity === "dense" ? 10 : effectiveDensity === "medium" ? 16 : 28;
  const junctionDotSize = isMobile ? 6 : effectiveDensity === "dense" ? 7 : 10;
  const connectorWidth = isMobile ? 20 : effectiveDensity === "dense" ? 28 : 40;
  const cardMaxWidth = effectiveDensity === "dense" ? 300 : effectiveDensity === "medium" ? 340 : 380;

  // Empty state (visitor, no content at all)
  if (rootStemItems.length === 0 && !isOwner) {
    return <p style={styles.empty}>No artifacts yet.</p>;
  }

  const gridColumns = isMobile ? "4px 1fr" : "1fr 4px 1fr";

  // Shared props every StemBranchItem + ExpandedNode needs
  const sharedProps = {
    expanded,
    toggleExpand,
    childNodesMap,
    nodeToArtifacts,
    artifactsById,
    artifactToNodes,
    nodesById,
    stemId,
    stemUserId,
    stemUsername,
    currentUserId,
    isOwner,
    canContribute,
    contributionMode,
    canUpload,
    density: effectiveDensity,
    cardMaxWidth,
    isMobile,
  };

  return (
    <DragProvider stemId={stemId} items={dragItems} isOwner={isOwner}>
      <div style={organicStyles.wrapper}>

        {/* Owner: density gear (top-right, unobtrusive) */}
        {isOwner && (
          <div style={organicStyles.gearRow}>
            <DensityGear
              current={override ?? density}
              auto={override === null}
              onChange={(value) => setOverride(value)}
            />
          </div>
        )}

        {useTrunk ? (
          <div
            data-stem-grid
            style={{
              ...organicStyles.grid,
              gridTemplateColumns: gridColumns,
              gap: `${rowGap}px 0`,
            }}
          >
            <div
              style={{
                ...organicStyles.trunk,
                gridColumn: isMobile ? "1" : "2",
                gridRow: `1 / ${rootStemItems.length + 2}`,
              }}
            />
            {rootStemItems.map((item, index) => (
              <StemBranchItem
                key={item.id}
                item={item}
                index={index}
                side={resolveSide(item, index)}
                junctionDotSize={junctionDotSize}
                connectorWidth={connectorWidth}
                rowGap={rowGap}
                {...sharedProps}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              ...organicStyles.linear,
              gap: `${Math.max(rowGap, 16)}px`,
            }}
          >
            {rootStemItems.map((item) => (
              <LinearItem key={item.id} item={item} {...sharedProps} />
            ))}
          </div>
        )}

        {rootStemItems.length === 0 && isOwner && (
          <p style={{ ...styles.empty, padding: "40px 20px" }}>
            Add your first node or artifact to start growing your stem
          </p>
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

function resolveSide(item: StemItem, index: number): "left" | "right" {
  if (item.side === 1) return "left";
  if (item.side === 2) return "right";
  return index % 2 === 0 ? "right" : "left";
}

// ── Shared props shape for inner components ────────────────────────────────

interface SharedProps {
  expanded: Set<string>;
  toggleExpand: (nodeId: string) => void;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  nodesById: Map<string, Node>;
  stemId: string;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  isOwner: boolean;
  canContribute: boolean;
  contributionMode: string;
  canUpload: boolean;
  density: Density;
  cardMaxWidth: number;
  isMobile: boolean;
}

// ── One branch on the main trunk ───────────────────────────────────────────

function StemBranchItem({
  item, index, side,
  junctionDotSize, connectorWidth, rowGap,
  ...shared
}: SharedProps & {
  item: StemItem;
  index: number;
  side: "left" | "right";
  junctionDotSize: number;
  connectorWidth: number;
  rowGap: number;
}) {
  const drag = useDragContext();
  const { isMobile, cardMaxWidth, nodesById, artifactsById, nodeToArtifacts, artifactToNodes, expanded, isOwner } = shared;

  const gridColumn = isMobile ? "2" : side === "left" ? "1 / 3" : "2 / 4";
  const connectorStyle: React.CSSProperties = { ...organicStyles.connector, width: connectorWidth };
  const dotStyle: React.CSSProperties = {
    ...organicStyles.junctionDot,
    width: junctionDotSize, height: junctionDotSize,
  };

  if (item.type === "node") {
    const node = nodesById.get(item.id);
    if (!node) return null;
    const isExpanded = expanded.has(node.id);
    const artifactCount = (nodeToArtifacts.get(node.id) || []).length;
    const subNodeCount = (shared.childNodesMap.get(node.id) || []).length;
    const previewItems = buildNodePreview(
      node.id, shared.childNodesMap, shared.nodeToArtifacts, shared.artifactsById, shared.nodesById,
    );

    return (
      <div
        data-drag-idx={index}
        data-node-anchor={node.id}
        onPointerDown={isOwner && drag ? drag.handlePointerDown(index, item) : undefined}
        style={{
          ...organicStyles.branchItem,
          gridColumn,
          gridRow: index + 1,
          flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
          alignItems: "flex-start",
          cursor: isOwner && drag ? "grab" : undefined,
          touchAction: isOwner ? "none" : undefined,
        }}
      >
        <div
          style={{
            ...organicStyles.connectorWrap,
            flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
            marginTop: 22,
          }}
        >
          <div style={dotStyle} />
          <div style={connectorStyle} />
        </div>
        <div
          data-node-drop={node.id}
          style={{ flex: 1, minWidth: 0, maxWidth: cardMaxWidth, display: "flex", flexDirection: "column" }}
        >
          <NodeCard
            node={node}
            artifactCount={artifactCount}
            subNodeCount={subNodeCount}
            previewItems={previewItems}
            density={shared.density}
            expanded={isExpanded}
            onClick={() => shared.toggleExpand(node.id)}
          />
          {isExpanded && (
            <ExpandedNode node={node} {...shared} rowGap={rowGap} />
          )}
        </div>
      </div>
    );
  }

  // Artifact branch
  const artifact = artifactsById.get(item.id);
  if (!artifact) return null;
  return (
    <div
      data-drag-idx={index}
      onPointerDown={isOwner && drag ? drag.handlePointerDown(index, item) : undefined}
      style={{
        ...organicStyles.branchItem,
        gridColumn,
        gridRow: index + 1,
        flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
        alignItems: "center",
        cursor: isOwner && drag ? "grab" : undefined,
        touchAction: isOwner ? "none" : undefined,
      }}
    >
      <div
        style={{
          ...organicStyles.connectorWrap,
          flexDirection: side === "left" && !isMobile ? "row-reverse" : "row",
        }}
      >
        <div style={dotStyle} />
        <div style={connectorStyle} />
      </div>
      <div style={{ ...organicStyles.cardWrapper, maxWidth: cardMaxWidth }}>
        <ArtifactCard
          artifact={artifact}
          stemId={shared.stemId}
          stemUserId={shared.stemUserId}
          currentUserId={shared.currentUserId}
          stemUsername={shared.stemUsername}
          density={shared.density}
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
    </div>
  );
}

// ── A linear-layout item (used when root has <= 3 items) ───────────────────

function LinearItem({
  item,
  ...shared
}: SharedProps & { item: StemItem }) {
  const { nodesById, artifactsById, nodeToArtifacts, artifactToNodes, expanded, cardMaxWidth } = shared;

  if (item.type === "node") {
    const node = nodesById.get(item.id);
    if (!node) return null;
    const isExpanded = expanded.has(node.id);
    const artifactCount = (nodeToArtifacts.get(node.id) || []).length;
    const subNodeCount = (shared.childNodesMap.get(node.id) || []).length;
    const previewItems = buildNodePreview(
      node.id, shared.childNodesMap, shared.nodeToArtifacts, shared.artifactsById, shared.nodesById,
    );
    return (
      <div data-node-anchor={node.id} data-node-drop={node.id} style={{ width: "100%", maxWidth: cardMaxWidth, display: "flex", flexDirection: "column" }}>
        <NodeCard
          node={node}
          artifactCount={artifactCount}
          subNodeCount={subNodeCount}
          previewItems={previewItems}
          density={shared.density}
          expanded={isExpanded}
          onClick={() => shared.toggleExpand(node.id)}
        />
        {isExpanded && <ExpandedNode node={node} {...shared} rowGap={16} />}
      </div>
    );
  }

  const artifact = artifactsById.get(item.id);
  if (!artifact) return null;
  return (
    <div style={{ width: "100%", maxWidth: cardMaxWidth }}>
      <ArtifactCard
        artifact={artifact}
        stemId={shared.stemId}
        stemUserId={shared.stemUserId}
        currentUserId={shared.currentUserId}
        stemUsername={shared.stemUsername}
        density={shared.density}
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
}

// ── Expanded node: its children render directly below its card ─────────────

function ExpandedNode({
  node,
  rowGap,
  ...shared
}: SharedProps & { node: Node; rowGap: number }) {
  const { childNodesMap, nodeToArtifacts, artifactsById, expanded, cardMaxWidth } = shared;

  const childNodes = childNodesMap.get(node.id) || [];
  const directArtifacts = (nodeToArtifacts.get(node.id) || [])
    .map((id) => artifactsById.get(id))
    .filter(Boolean) as Artifact[];

  const items = useMemo(() => {
    const list: StemItem[] = [];
    for (const n of childNodes) {
      list.push({ id: n.id, type: "node", position: n.position, side: n.stem_side ?? 0 });
    }
    for (const a of directArtifacts) {
      list.push({
        id: a.id, type: "artifact",
        position: a.stem_position ?? 999999,
        side: a.stem_side ?? 0,
      });
    }
    list.sort((a, b) => a.position - b.position);
    return list;
  }, [childNodes, directArtifacts]);

  const isEmpty = items.length === 0;

  return (
    <div
      style={{
        ...organicStyles.expandedChildren,
        gap: `${Math.max(rowGap - 4, 12)}px`,
      }}
    >
      {isEmpty && !shared.canContribute && !shared.isOwner && (
        <p style={organicStyles.expandedEmpty}>Empty for now.</p>
      )}
      {items.map((item) => (
        <ExpandedItem key={item.id} item={item} {...shared} rowGap={rowGap} />
      ))}
      {shared.canContribute && (
        <div style={{ marginTop: 8 }}>
          <AddArtifactForm
            stemId={shared.stemId}
            isOwner={shared.isOwner}
            stemUsername={shared.stemUsername}
            contributionMode={shared.contributionMode}
            canUpload={shared.canUpload}
            nodeId={node.id}
          />
        </div>
      )}
      {shared.isOwner && (
        <div style={{ marginTop: 4 }}>
          <AddNodeForm stemId={shared.stemId} parentId={node.id} />
        </div>
      )}
    </div>
  );
}

function ExpandedItem({
  item,
  rowGap,
  ...shared
}: SharedProps & { item: StemItem; rowGap: number }) {
  const { nodesById, artifactsById, nodeToArtifacts, artifactToNodes, expanded } = shared;

  if (item.type === "node") {
    const node = nodesById.get(item.id);
    if (!node) return null;
    const isExpanded = expanded.has(node.id);
    const artifactCount = (nodeToArtifacts.get(node.id) || []).length;
    const subNodeCount = (shared.childNodesMap.get(node.id) || []).length;
    const previewItems = buildNodePreview(
      node.id, shared.childNodesMap, shared.nodeToArtifacts, shared.artifactsById, shared.nodesById,
    );
    return (
      <div data-node-anchor={node.id} data-node-drop={node.id} style={{ display: "flex", flexDirection: "column" }}>
        <NodeCard
          node={node}
          artifactCount={artifactCount}
          subNodeCount={subNodeCount}
          previewItems={previewItems}
          density={shared.density}
          expanded={isExpanded}
          onClick={() => shared.toggleExpand(node.id)}
        />
        {isExpanded && <ExpandedNode node={node} {...shared} rowGap={rowGap} />}
      </div>
    );
  }

  const artifact = artifactsById.get(item.id);
  if (!artifact) return null;
  return (
    <ArtifactCard
      artifact={artifact}
      stemId={shared.stemId}
      stemUserId={shared.stemUserId}
      currentUserId={shared.currentUserId}
      stemUsername={shared.stemUsername}
      density={shared.density}
      nodeNames={
        artifactToNodes.has(artifact.id)
          ? artifactToNodes
              .get(artifact.id)!
              .map((nid) => nodesById.get(nid)?.title ?? "")
              .filter(Boolean)
          : undefined
      }
    />
  );
}

// ── Density gear + popover ─────────────────────────────────────────────────

function DensityGear({
  current,
  auto,
  onChange,
}: {
  current: Density;
  auto: boolean;
  onChange: (value: Density | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && e.target instanceof HTMLElement && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options: { value: Density; label: string; title: string }[] = [
    { value: "airy", label: "airy", title: "Roomy spacing, large cards" },
    { value: "medium", label: "medium", title: "Balanced density" },
    { value: "dense", label: "dense", title: "Compact, one-line cards" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ ...styles.densityGear, ...(open ? styles.densityGearActive : null) }}
        title="Display density"
        aria-label="Display density"
      >
        {"\u2699"}
      </button>
      {open && (
        <div style={styles.densityPopover} role="menu">
          <span style={styles.densityPopoverLabel}>Density</span>
          <div style={styles.densityToggleRow}>
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
          {!auto && (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{
                display: "block", margin: "8px 6px 0", padding: 0,
                background: "none", border: "none",
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                color: "var(--ink-light)", cursor: "pointer",
                textDecoration: "underline", textDecorationColor: "var(--paper-dark)",
              }}
            >
              reset to auto
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── useMediaQuery ──────────────────────────────────────────────────────────

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

  gearRow: {
    display: "flex",
    justifyContent: "flex-end",
    maxWidth: 900,
    margin: "0 auto 8px",
    padding: "0 24px",
  },

  grid: {
    display: "grid",
    gridAutoRows: "auto",
    position: "relative",
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 24px",
    alignItems: "start",
  },

  linear: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 900,
    margin: "0 auto",
    padding: "8px 24px 0",
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

  // Expanded node's children render indented under the parent card,
  // connected by a subtle vertical line.
  expandedChildren: {
    display: "flex",
    flexDirection: "column",
    marginTop: 12,
    paddingLeft: 16,
    borderLeft: "2px solid var(--leaf-border)",
    marginLeft: 12,
    animation: "fadeUp 0.2s ease-out",
  },

  expandedEmpty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontStyle: "italic" as const,
    color: "var(--ink-light)",
    padding: "6px 0",
  },
};
