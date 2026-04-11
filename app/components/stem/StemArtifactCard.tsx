import { useState } from "react";
import type { Artifact } from "./types";
import { getDomain } from "~/lib/utils";
import { artifactTypeLabel } from "./ArtifactCard";

const CARD_WIDTH = 320;

export function StemArtifactCard({
  artifact,
  onClick,
  isMobile,
}: {
  artifact: Artifact;
  onClick: () => void;
  isMobile?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const isNote = artifact.source_type === "note";
  const isFile = !!artifact.file_key;
  const isImage = isFile && artifact.source_type === "image";
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);
  const title = artifact.title || artifact.url || "Untitled";

  const imageSrc = isImage
    ? `https://api.stem.md/files/${artifact.file_key}`
    : artifact.image_url || null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...s.card,
        ...(isMobile ? s.cardMobile : {}),
        ...(hovered ? s.cardHover : {}),
      }}
    >
      {/* Image thumbnail */}
      {imageSrc && (
        <div style={s.thumbWrap}>
          <img
            src={imageSrc}
            alt=""
            style={s.thumb}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Card body */}
      <div style={s.body}>
        <p style={s.title}>{title}</p>

        {/* Domain + type */}
        {!isNote && (
          <div style={s.meta}>
            {artifact.favicon_url && (
              <img
                src={artifact.favicon_url}
                alt=""
                style={s.favicon}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span>{domain || typeInfo.label}</span>
            <span style={s.typeBadge}>
              {typeInfo.emoji} {typeInfo.label}
            </span>
          </div>
        )}

        {/* Note type: show body preview */}
        {isNote && (
          <div style={s.meta}>
            <span>{typeInfo.emoji} Note</span>
          </div>
        )}

        {/* Quote preview */}
        {artifact.quote && (
          <p style={s.quotePreview}>"{artifact.quote}"</p>
        )}

        {/* Note preview (only if no quote) */}
        {!artifact.quote && artifact.note && (
          <p style={s.notePreview}>{artifact.note}</p>
        )}

        {/* Note body preview */}
        {isNote && artifact.body && !artifact.quote && !artifact.note && (
          <p style={s.notePreview}>{artifact.body}</p>
        )}
      </div>
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    width: CARD_WIDTH,
    maxWidth: "calc(100vw - 120px)",
    display: "flex",
    flexDirection: "column",
    borderRadius: 10,
    border: "1px solid var(--paper-dark)",
    background: "var(--surface)",
    overflow: "hidden",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    padding: 0,
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
  },
  cardMobile: {
    width: "100%",
    maxWidth: "none",
  },
  cardHover: {
    borderColor: "var(--forest)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },

  // Image thumbnail
  thumbWrap: {
    width: "100%",
    height: 120,
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--paper-mid)",
  },
  thumb: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },

  // Card body
  body: {
    padding: "10px 14px 12px",
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.4,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  meta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  typeBadge: {
    fontSize: 11,
    padding: "1px 6px",
    borderRadius: 4,
    background: "var(--paper-mid)",
    color: "var(--ink-mid)",
    fontFamily: "'DM Mono', monospace",
    flexShrink: 0,
  },
  favicon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    flexShrink: 0,
    objectFit: "contain" as const,
  },
  quotePreview: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    marginTop: 6,
    marginBottom: 0,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  notePreview: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    marginTop: 6,
    marginBottom: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
};
