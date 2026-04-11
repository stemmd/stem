import { useMemo, useState, useCallback, useEffect } from "react";
import type { Node, Artifact } from "./types";
import { StemBranch } from "./StemBranch";
import { StemArtifactCard } from "./StemArtifactCard";
import { ArtifactDetailPanel } from "./ArtifactDetailPanel";
import { useMediaQuery } from "~/lib/hooks";

const STEM_WIDTH = 2;
const STEM_GUTTER = 28;
const STEM_GUTTER_MOBILE = 16;
const CONNECTOR_LEN = 20;
const CONNECTOR_MOBILE = 12;

export function StemTree({
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
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 680px)");

  const gutter = isMobile ? STEM_GUTTER_MOBILE : STEM_GUTTER;
  const connectorLen = isMobile ? CONNECTOR_MOBILE : CONNECTOR_LEN;

  // No navigation state — always at root
  useEffect(() => {
    onNodeChange?.(null);
  }, [onNodeChange]);

  // ── Artifact detail handlers ──────────────────────────────────
  const handleArtifactClick = useCallback((artifactId: string) => {
    setSelectedArtifactId(artifactId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedArtifactId(null);
  }, []);

  // Escape key to close modal
  useEffect(() => {
    if (!selectedArtifactId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedArtifactId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedArtifactId]);

  const selectedArtifact = selectedArtifactId
    ? artifactsById.get(selectedArtifactId) ?? null
    : null;

  // ── Build root-level items sorted by position ─────────────────
  const rootItems = useMemo(() => {
    const items: { id: string; type: "node" | "artifact"; position: number }[] = [];
    for (const node of rootNodes) {
      items.push({ id: node.id, type: "node", position: node.position });
    }
    for (const artifact of rootArtifacts) {
      items.push({ id: artifact.id, type: "artifact", position: artifact.stem_position ?? 999999 });
    }
    items.sort((a, b) => a.position - b.position);
    return items;
  }, [rootNodes, rootArtifacts]);

  const totalArtifacts = artifactsById.size;
  const totalNodes = approvedNodes.length;
  const isEmpty = rootItems.length === 0;

  const nodesById = useMemo(
    () => new Map(approvedNodes.map((n) => [n.id, n])),
    [approvedNodes]
  );

  return (
    <div style={s.wrapper}>
      {/* Stats bar */}
      {!isEmpty && (
        <div style={s.statsBar}>
          {totalNodes > 0 && (
            <span style={s.stat}>
              {totalNodes} {totalNodes === 1 ? "node" : "nodes"}
            </span>
          )}
          {totalNodes > 0 && totalArtifacts > 0 && (
            <span style={s.statDot}>{"\u00B7"}</span>
          )}
          <span style={s.stat}>
            {totalArtifacts} {totalArtifacts === 1 ? "artifact" : "artifacts"}
          </span>
        </div>
      )}

      {/* Tree container */}
      <div
        style={{
          ...s.treeContainer,
          paddingLeft: gutter,
        }}
      >
        {/* Main stem line */}
        {!isEmpty && (
          <div
            style={{
              ...s.stemLine,
              left: gutter - 1,
            }}
          />
        )}

        {/* Root-level items (interleaved nodes + artifacts by position) */}
        {rootItems.map((item, idx) => {
          if (item.type === "node") {
            const node = nodesById.get(item.id);
            if (!node) return null;
            return (
              <StemBranch
                key={item.id}
                node={node}
                depth={0}
                childNodesMap={childNodesMap}
                nodeToArtifacts={nodeToArtifacts}
                artifactsById={artifactsById}
                onArtifactClick={handleArtifactClick}
                isMobile={isMobile}
                isLast={idx === rootItems.length - 1}
              />
            );
          }

          // Root artifact
          const artifact = artifactsById.get(item.id);
          if (!artifact) return null;
          return (
            <div
              key={item.id}
              style={{
                position: "relative" as const,
                marginBottom: 16,
                paddingLeft: connectorLen + 8,
              }}
            >
              {/* Connector line */}
              <div
                style={{
                  position: "absolute" as const,
                  left: 0,
                  top: 24,
                  width: connectorLen,
                  height: STEM_WIDTH,
                  background: "var(--paper-dark)",
                }}
              />
              <StemArtifactCard
                artifact={artifact}
                onClick={() => handleArtifactClick(artifact.id)}
                isMobile={isMobile}
              />
            </div>
          );
        })}

        {/* Empty state */}
        {isEmpty && (
          <p style={s.empty}>
            {isOwner ? "Your stem is empty \u2014 add items with the + button" : "Nothing here yet"}
          </p>
        )}
      </div>

      {/* Artifact detail modal */}
      {selectedArtifact && (
        <div
          style={s.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
        >
          <div style={isMobile ? s.modalMobile : s.modal}>
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

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    background: "var(--paper)",
    minHeight: 300,
  },

  // Stats
  statsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 24px",
    borderBottom: "1px solid var(--paper-dark)",
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

  // Tree container
  treeContainer: {
    position: "relative" as const,
    padding: "24px 24px 40px",
  },

  // Main stem line
  stemLine: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: STEM_WIDTH,
    background: "var(--paper-dark)",
  },

  // Empty state
  empty: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    textAlign: "center" as const,
    padding: "60px 20px",
  },

  // Modal overlay
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
