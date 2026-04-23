import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Artifact, Node } from "./types";
import { styles } from "./stem-styles";
import { ArtifactCard } from "./ArtifactCard";
import { NodeCard } from "./NodeCard";
import { AddNodeForm } from "./AddNodeForm";
import { AddArtifactForm } from "./AddArtifactForm";
import { DragProvider, useDragContext } from "./DragContext";
import { FloatingAddButton } from "./FloatingAddButton";
import { useDensity, type Density } from "./useDensity";

/**
 * A single item on a stem level — either a node or an artifact.
 */
interface StemItem {
  id: string;
  type: "node" | "artifact";
  position: number;
  side: number; // 0 = auto, 1 = left, 2 = right
}

type TransitionDirection = "in" | "out";

/**
 * OrganicStem is the recursive surface of the stem page.
 *
 * The root stem and every node use the same layout grammar: a trunk
 * when there's enough to branch between (>= 4 items on the level),
 * or a quiet linear stack when there isn't. Navigating into a node
 * replaces the current level's render with the node's — no panel,
 * no takeover, just a change of "where you are."
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
  const [focusedStack, setFocusedStack] = useState<string[]>([]);
  const [direction, setDirection] = useState<TransitionDirection>("in");
  const isMobile = useMediaQuery("(max-width: 680px)");

  const totalItemCount =
    rootNodes.length + rootArtifacts.length + approvedNodes.length +
    Array.from(nodeToArtifacts.values()).reduce((sum, arr) => sum + arr.length, 0);

  const { density, override, setOverride } = useDensity(stemId, totalItemCount);
  const effectiveDensity: Density = isMobile && density === "airy" ? "medium" : density;

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  const currentNodeId = focusedStack.length > 0 ? focusedStack[focusedStack.length - 1] : null;
  const currentNode = currentNodeId ? nodesById.get(currentNodeId) ?? null : null;

  // ── Navigation actions ──────────────────────────────────────────────────
  const updateHash = useCallback((nodeId: string | null) => {
    if (typeof window === "undefined") return;
    const url = nodeId
      ? `${window.location.pathname}${window.location.search}#node-${nodeId}`
      : `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", url);
  }, []);

  const diveInto = useCallback((nodeId: string) => {
    setDirection("in");
    setFocusedStack((prev) => {
      const existingIdx = prev.indexOf(nodeId);
      const next = existingIdx >= 0 ? prev.slice(0, existingIdx + 1) : [...prev, nodeId];
      updateHash(nodeId);
      return next;
    });
  }, [updateHash]);

  const jumpToSibling = useCallback((nodeId: string) => {
    setDirection("out");
    setFocusedStack((prev) => {
      const next = prev.length > 0 ? [...prev.slice(0, -1), nodeId] : [nodeId];
      updateHash(nodeId);
      return next;
    });
  }, [updateHash]);

  const jumpToAncestor = useCallback((stackIndex: number) => {
    setDirection("out");
    setFocusedStack((prev) => {
      const next = prev.slice(0, stackIndex + 1);
      const lastId = next.length > 0 ? next[next.length - 1] : null;
      updateHash(lastId);
      return next;
    });
  }, [updateHash]);

  const jumpToRoot = useCallback(() => {
    setDirection("out");
    setFocusedStack([]);
    updateHash(null);
  }, [updateHash]);

  // Initialize from URL hash on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#node-")) {
      const nodeId = hash.slice(6);
      if (approvedNodes.some((n) => n.id === nodeId)) {
        setFocusedStack([nodeId]);
      }
    }
  }, [approvedNodes]);

  // Esc handler — go up one level
  useEffect(() => {
    if (focusedStack.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDirection("out");
        setFocusedStack((prev) => {
          const next = prev.slice(0, -1);
          const lastId = next.length > 0 ? next[next.length - 1] : null;
          updateHash(lastId);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedStack.length, updateHash]);

  // ── Current level data ──────────────────────────────────────────────────
  const levelChildNodes = currentNode
    ? (childNodesMap.get(currentNode.id) || [])
    : rootNodes;

  const levelArtifacts = useMemo(() => {
    if (currentNode) {
      return (nodeToArtifacts.get(currentNode.id) || [])
        .map((id) => artifactsById.get(id))
        .filter(Boolean) as Artifact[];
    }
    return rootArtifacts;
  }, [currentNode, nodeToArtifacts, artifactsById, rootArtifacts]);

  const stemItems = useMemo(() => {
    const items: StemItem[] = [];
    for (const node of levelChildNodes) {
      items.push({ id: node.id, type: "node", position: node.position, side: node.stem_side ?? 0 });
    }
    for (const artifact of levelArtifacts) {
      items.push({
        id: artifact.id, type: "artifact",
        position: artifact.stem_position ?? 999999,
        side: artifact.stem_side ?? 0,
      });
    }
    items.sort((a, b) => a.position - b.position);
    return items;
  }, [levelChildNodes, levelArtifacts]);

  // ── Siblings + breadcrumbs ──────────────────────────────────────────────
  const siblings = useMemo(() => {
    if (!currentNode) return [] as Node[];
    if (currentNode.parent_id) {
      return childNodesMap.get(currentNode.parent_id) || [];
    }
    return rootNodes;
  }, [currentNode, childNodesMap, rootNodes]);

  // Breadcrumb = path of ancestors, NOT including the current node.
  const breadcrumbs = useMemo(() => {
    return focusedStack.slice(0, -1).map((id) => {
      const node = nodesById.get(id);
      return { id, title: node?.title ?? "", emoji: node?.emoji ?? "" };
    });
  }, [focusedStack, nodesById]);

  const dragItems = useMemo(
    () => stemItems.map((item) => ({ id: item.id, type: item.type })),
    [stemItems]
  );

  // ── Layout params ───────────────────────────────────────────────────────
  const useTrunk = stemItems.length >= 4;
  const rowGap = effectiveDensity === "dense" ? 10 : effectiveDensity === "medium" ? 16 : 28;
  const junctionDotSize = isMobile ? 6 : effectiveDensity === "dense" ? 7 : 10;
  const connectorWidth = isMobile ? 20 : effectiveDensity === "dense" ? 28 : 40;
  const cardMaxWidth = effectiveDensity === "dense" ? 300 : effectiveDensity === "medium" ? 340 : 380;

  // Empty state (visitor on a fresh stem)
  if (stemItems.length === 0 && !isOwner && !currentNode) {
    return <p style={styles.empty}>No artifacts yet.</p>;
  }

  const levelKey = currentNodeId ?? "__root__";

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

        {/* ── Current level (keyed so it re-mounts + animates on navigate) ── */}
        <div
          key={levelKey}
          style={{
            ...organicStyles.level,
            animation: `${direction === "in" ? "zoomEnterIn" : "zoomEnterOut"} 220ms ease-out`,
          }}
        >

          {/* Breadcrumb — ancestor path, not shown at root */}
          {breadcrumbs.length >= 0 && currentNode && (
            <nav style={organicStyles.breadcrumb} aria-label="Location">
              <button
                type="button"
                onClick={jumpToRoot}
                style={organicStyles.breadcrumbLink}
              >
                {"\u2190"} Stem
              </button>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} style={organicStyles.breadcrumbItem}>
                  <span style={organicStyles.breadcrumbSep}>/</span>
                  <button
                    type="button"
                    onClick={() => jumpToAncestor(i)}
                    style={organicStyles.breadcrumbLink}
                  >
                    {crumb.emoji && `${crumb.emoji} `}{crumb.title}
                  </button>
                </span>
              ))}
            </nav>
          )}

          {/* Sibling row — only when there's something to pick between */}
          {currentNode && siblings.length > 1 && (
            <SiblingRow
              parentLabel={
                currentNode.parent_id
                  ? (nodesById.get(currentNode.parent_id)?.title ?? "")
                  : "at this level"
              }
              siblings={siblings}
              currentId={currentNode.id}
              onSelect={jumpToSibling}
            />
          )}

          {/* Node header (only inside a node; root's header lives outside OrganicStem) */}
          {currentNode && (
            <header style={organicStyles.nodeHeader}>
              {currentNode.emoji && (
                <span style={organicStyles.nodeHeaderEmoji}>{currentNode.emoji}</span>
              )}
              <h2 style={organicStyles.nodeHeaderTitle}>{currentNode.title}</h2>
              {currentNode.description && (
                <p style={organicStyles.nodeHeaderDesc}>{currentNode.description}</p>
              )}
              <span style={organicStyles.nodeHeaderCount}>
                {levelArtifacts.length} {levelArtifacts.length === 1 ? "artifact" : "artifacts"}
                {levelChildNodes.length > 0 && ` · ${levelChildNodes.length} sub-${levelChildNodes.length === 1 ? "node" : "nodes"}`}
              </span>
            </header>
          )}

          {/* Trunk or linear list */}
          {useTrunk ? (
            <TrunkLevel
              stemItems={stemItems}
              isMobile={isMobile}
              isOwner={isOwner}
              density={effectiveDensity}
              rowGap={rowGap}
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
              currentNodeId={currentNodeId}
              onDive={diveInto}
            />
          ) : (
            <LinearLevel
              stemItems={stemItems}
              isMobile={isMobile}
              isOwner={isOwner}
              density={effectiveDensity}
              rowGap={rowGap}
              cardMaxWidth={cardMaxWidth}
              nodesById={nodesById}
              nodeToArtifacts={nodeToArtifacts}
              artifactsById={artifactsById}
              artifactToNodes={artifactToNodes}
              stemId={stemId}
              stemUserId={stemUserId}
              stemUsername={stemUsername}
              currentUserId={currentUserId}
              currentNodeId={currentNodeId}
              onDive={diveInto}
            />
          )}

          {stemItems.length === 0 && isOwner && (
            <p style={{ ...styles.empty, padding: "40px 20px" }}>
              {currentNode ? "Nothing here yet. Add a sub-node or artifact below." : "Add your first node or artifact to start growing your stem"}
            </p>
          )}

          {stemItems.length === 0 && !isOwner && currentNode && (
            <p style={{ ...styles.empty, padding: "40px 0" }}>No artifacts in this node yet.</p>
          )}

          {/* Contribute form (only inside a node — root's form lives above OrganicStem) */}
          {currentNode && canContribute && (
            <div style={{ maxWidth: 640, marginTop: 28, marginLeft: "auto", marginRight: "auto" }}>
              <AddArtifactForm
                stemId={stemId}
                isOwner={isOwner}
                stemUsername={stemUsername}
                contributionMode={contributionMode}
                canUpload={canUpload}
                nodeId={currentNodeId}
              />
            </div>
          )}

          {/* AddNode (owner, inside a node — root's AddNode form is above OrganicStem) */}
          {currentNode && isOwner && (
            <div style={{ marginTop: 16, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
              <AddNodeForm stemId={stemId} parentId={currentNodeId} />
            </div>
          )}
        </div>

        {/* Floating add button (owner, root level only) */}
        {isOwner && !currentNode && (
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

// ── Sibling row ─────────────────────────────────────────────────────────────

function SiblingRow({
  parentLabel,
  siblings,
  currentId,
  onSelect,
}: {
  parentLabel: string;
  siblings: Node[];
  currentId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div style={styles.siblingRow} aria-label="Peer nodes">
      <span style={styles.siblingRowLabel}>{parentLabel} ·</span>
      {siblings.map((s, i) => {
        const active = s.id === currentId;
        return (
          <span key={s.id} style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            {i > 0 && <span style={styles.siblingInlineSep}>·</span>}
            {active ? (
              <span style={styles.siblingInlineActive} aria-current="page">
                {s.emoji && <span style={{ fontSize: 13, lineHeight: 1 }}>{s.emoji}</span>}
                <span>{s.title}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                style={styles.siblingInline}
                onMouseOver={(e) => (e.currentTarget.style.color = "var(--ink-mid)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-light)")}
              >
                {s.emoji && <span style={{ fontSize: 12, lineHeight: 1 }}>{s.emoji}</span>}
                <span>{s.title}</span>
              </button>
            )}
          </span>
        );
      })}
    </div>
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

// ── Trunk layout (used when level has >= 4 items) ──────────────────────────

function TrunkLevel({
  stemItems,
  isMobile,
  isOwner,
  density,
  rowGap,
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
  currentNodeId,
  onDive,
}: {
  stemItems: StemItem[];
  isMobile: boolean;
  isOwner: boolean;
  density: Density;
  rowGap: number;
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
  currentNodeId: string | null;
  onDive: (nodeId: string) => void;
}) {
  const getItemSide = useCallback(
    (item: StemItem, index: number): "left" | "right" => {
      if (item.side === 1) return "left";
      if (item.side === 2) return "right";
      return index % 2 === 0 ? "right" : "left";
    },
    []
  );

  const gridColumns = isMobile ? "4px 1fr" : "1fr 4px 1fr";

  return (
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
          gridRow: `1 / ${stemItems.length + 2}`,
        }}
      />
      {stemItems.map((item, index) => (
        <StemBranchItem
          key={item.id}
          item={item}
          index={index}
          isMobile={isMobile}
          side={getItemSide(item, index)}
          isOwner={isOwner}
          density={density}
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
          currentNodeId={currentNodeId}
          onDive={onDive}
        />
      ))}
    </div>
  );
}

// ── Linear layout (used when level has <= 3 items) ─────────────────────────

function LinearLevel({
  stemItems,
  isMobile: _isMobile,
  isOwner,
  density,
  rowGap,
  cardMaxWidth,
  nodesById,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  stemId,
  stemUserId,
  stemUsername,
  currentUserId,
  currentNodeId,
  onDive,
}: {
  stemItems: StemItem[];
  isMobile: boolean;
  isOwner: boolean;
  density: Density;
  rowGap: number;
  cardMaxWidth: number;
  nodesById: Map<string, Node>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  stemId: string;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  currentNodeId: string | null;
  onDive: (nodeId: string) => void;
}) {
  const drag = useDragContext();

  return (
    <div
      style={{
        ...organicStyles.linear,
        gap: `${Math.max(rowGap, 16)}px`,
      }}
    >
      {stemItems.map((item, index) => {
        if (item.type === "node") {
          const node = nodesById.get(item.id);
          if (!node) return null;
          const count = (nodeToArtifacts.get(node.id) || []).length;
          return (
            <div
              key={item.id}
              data-node-drop={node.id}
              style={{ width: "100%", maxWidth: cardMaxWidth, borderRadius: 12, transition: "outline 0.15s" }}
            >
              <NodeCard node={node} artifactCount={count} density={density} onClick={() => onDive(node.id)} />
            </div>
          );
        }
        const artifact = artifactsById.get(item.id);
        if (!artifact) return null;
        return (
          <div
            key={item.id}
            data-drag-idx={index}
            onPointerDown={isOwner && drag ? drag.handlePointerDown(index, { id: item.id, type: "artifact" }) : undefined}
            style={{
              width: "100%", maxWidth: cardMaxWidth,
              cursor: isOwner && drag ? "grab" : undefined,
              touchAction: isOwner ? "none" : undefined,
            }}
          >
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
                      .filter((nid) => nid !== currentNodeId)
                      .map((nid) => nodesById.get(nid)?.title ?? "")
                      .filter(Boolean)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

// ── One branch item on the trunk ───────────────────────────────────────────

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
  currentNodeId,
  onDive,
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
  currentNodeId: string | null;
  onDive: (nodeId: string) => void;
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
        const count = (nodeToArtifacts.get(node.id) || []).length;
        return (
          <div data-node-drop={node.id} style={{ flex: 1, minWidth: 0, maxWidth: cardMaxWidth, borderRadius: 12, transition: "outline 0.15s" }}>
            <NodeCard node={node} artifactCount={count} density={density} onClick={() => onDive(node.id)} />
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
                      .filter((nid) => nid !== currentNodeId)
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

  level: {
    maxWidth: 900,
    margin: "0 auto",
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

  // ── Breadcrumb ─────────────────────────────────────────────────────────
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
    marginBottom: 10,
    padding: "0 24px",
    maxWidth: 900,
    margin: "0 auto 10px",
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

  // ── Node header (when inside a node) ───────────────────────────────────
  nodeHeader: {
    padding: "0 24px",
    maxWidth: 900,
    margin: "0 auto 28px",
  },

  nodeHeaderEmoji: {
    fontSize: 32,
    marginBottom: 8,
    display: "block",
    lineHeight: 1,
  },

  nodeHeaderTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.2,
    margin: 0,
    marginBottom: 8,
  },

  nodeHeaderDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    marginTop: 6,
    marginBottom: 10,
    maxWidth: 560,
  },

  nodeHeaderCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
};
