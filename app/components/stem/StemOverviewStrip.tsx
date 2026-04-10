import { useRef, useCallback } from "react";
import type { Node, Artifact } from "./types";
import type { ColumnItem } from "./StemColumn";
import { getDomain } from "~/lib/utils";
import { artifactTypeLabel } from "./ArtifactCard";

/**
 * Persistent horizontal strip of visual cards — nodes and root artifacts
 * in the creator's position order. Acts as top-level navigation for the stem.
 */
export function StemOverviewStrip({
  items,
  nodesById,
  artifactsById,
  childNodesMap,
  nodeToArtifacts,
  activeNodeId,
  activeArtifactId,
  onNodeClick,
  onArtifactClick,
}: {
  items: ColumnItem[];
  nodesById: Map<string, Node>;
  artifactsById: Map<string, Artifact>;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  activeNodeId: string | null;
  activeArtifactId: string | null;
  onNodeClick: (nodeId: string) => void;
  onArtifactClick: (artifactId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasActive = activeNodeId !== null || activeArtifactId !== null;

  // Find the first artifact with an image_url for a given node
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

  if (items.length === 0) return null;

  return (
    <div style={stripStyles.container}>
      <div ref={scrollRef} className="hide-scrollbar" style={stripStyles.scroll}>
        {items.map((item) => {
          if (item.type === "node") {
            const node = nodesById.get(item.id);
            if (!node) return null;
            const isActive = activeNodeId === node.id;
            const isDimmed = hasActive && !isActive;
            const thumb = getNodeThumbnail(node.id);
            const children = childNodesMap.get(node.id) || [];
            const artifactIds = nodeToArtifacts.get(node.id) || [];
            const count = children.length + artifactIds.length;

            return (
              <button
                key={node.id}
                onClick={() => onNodeClick(node.id)}
                style={{
                  ...stripStyles.card,
                  ...(isActive ? stripStyles.cardActive : {}),
                  ...(isDimmed ? stripStyles.cardDimmed : {}),
                }}
              >
                {thumb?.image_url ? (
                  <div style={stripStyles.thumbWrap}>
                    <img
                      src={thumb.image_url}
                      alt=""
                      style={stripStyles.thumbImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div style={{ ...stripStyles.thumbFallback, display: "none" }}>
                      <span style={stripStyles.fallbackEmoji}>{node.emoji || "📁"}</span>
                    </div>
                  </div>
                ) : (
                  <div style={stripStyles.typoThumb}>
                    <span style={stripStyles.typoEmoji}>{node.emoji || "📁"}</span>
                  </div>
                )}
                <div style={stripStyles.cardLabel}>
                  <span style={stripStyles.cardTitle}>{node.title}</span>
                  {count > 0 && (
                    <span style={stripStyles.cardCount}>
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
              </button>
            );
          }

          // Artifact card
          const artifact = artifactsById.get(item.id);
          if (!artifact) return null;
          const isActive = activeArtifactId === artifact.id;
          const isDimmed = hasActive && !isActive;
          const title = artifact.title || artifact.url || "Untitled";
          const domain = artifact.url ? getDomain(artifact.url) : null;
          const typeInfo = artifactTypeLabel(artifact.source_type);
          const isNote = artifact.source_type === "note";

          return (
            <button
              key={artifact.id}
              onClick={() => onArtifactClick(artifact.id)}
              style={{
                ...stripStyles.card,
                ...(isActive ? stripStyles.cardActive : {}),
                ...(isDimmed ? stripStyles.cardDimmed : {}),
              }}
            >
              {artifact.image_url ? (
                <div style={stripStyles.thumbWrap}>
                  <img
                    src={artifact.image_url}
                    alt=""
                    style={stripStyles.thumbImg}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div style={{ ...stripStyles.thumbFallback, display: "none" }}>
                    <span style={stripStyles.fallbackEmoji}>{typeInfo.emoji}</span>
                  </div>
                </div>
              ) : (
                <div style={stripStyles.typoThumb}>
                  {artifact.favicon_url ? (
                    <img
                      src={artifact.favicon_url}
                      alt=""
                      style={stripStyles.typoFavicon}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "";
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      ...stripStyles.typoEmoji,
                      ...(artifact.favicon_url ? { display: "none" } : {}),
                    }}
                  >
                    {typeInfo.emoji}
                  </span>
                </div>
              )}
              <div style={stripStyles.cardLabel}>
                <span style={stripStyles.cardTitle}>{title}</span>
                <span style={stripStyles.cardCount}>
                  {isNote ? "Note" : domain || typeInfo.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CARD_W = 156;
const THUMB_H = 68;

const stripStyles: Record<string, React.CSSProperties> = {
  container: {
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    flexShrink: 0,
  },
  scroll: {
    display: "flex",
    overflowX: "auto",
    overflowY: "hidden",
    gap: 10,
    padding: "14px 20px",
    scrollbarWidth: "none", // Firefox
    // WebKit scrollbar hidden via CSS class below
  },

  // ── Card base ────────────────────────────────────────────────
  card: {
    flex: `0 0 ${CARD_W}px`,
    width: CARD_W,
    border: "2px solid transparent",
    borderRadius: 10,
    overflow: "hidden",
    background: "var(--surface)",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, opacity 0.15s, box-shadow 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    padding: 0,
  },
  cardActive: {
    borderColor: "var(--forest)",
    boxShadow: "0 0 0 1px var(--forest), 0 2px 8px rgba(0,0,0,0.1)",
    opacity: 1,
  },
  cardDimmed: {
    opacity: 0.45,
  },

  // ── Thumbnail area (top of card) ─────────────────────────────
  thumbWrap: {
    position: "relative" as const,
    width: "100%",
    height: THUMB_H,
    overflow: "hidden",
    background: "var(--paper-mid)",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },
  thumbFallback: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--paper)",
  },
  fallbackEmoji: {
    fontSize: 24,
  },

  // ── Typographic thumbnail (no image) ─────────────────────────
  typoThumb: {
    width: "100%",
    height: THUMB_H,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--paper)",
    gap: 6,
  },
  typoEmoji: {
    fontSize: 26,
  },
  typoFavicon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    objectFit: "contain" as const,
  },

  // ── Label area (bottom of card) ──────────────────────────────
  cardLabel: {
    padding: "7px 10px 9px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  cardCount: {
    fontSize: 10,
    color: "var(--ink-light)",
    fontFamily: "'DM Mono', monospace",
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
};
