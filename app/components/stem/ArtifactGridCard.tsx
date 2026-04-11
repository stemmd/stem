import { useState } from "react";
import type { Artifact } from "./types";
import { getDomain } from "~/lib/utils";
import { artifactTypeLabel } from "./ArtifactCard";

export function ArtifactGridCard({
  artifact,
  onClick,
}: {
  artifact: Artifact;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const isNote = artifact.source_type === "note";
  const isFile = !!artifact.file_key;
  const isImage = isFile && artifact.source_type === "image";
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);
  const title = artifact.title || artifact.url || "Untitled";

  // Determine which image to show
  const imageSrc = isImage
    ? `https://api.stem.md/files/${artifact.file_key}`
    : artifact.image_url || null;

  const hasText = !!(artifact.quote || artifact.note || (isNote && artifact.body));

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyles.card,
        ...(hovered ? cardStyles.cardHover : {}),
      }}
    >
      {/* Image thumbnail */}
      {imageSrc && (
        <div style={cardStyles.thumbWrap}>
          <img
            src={imageSrc}
            alt=""
            style={cardStyles.thumb}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Text-only card: quote or note preview */}
      {!imageSrc && hasText && (
        <div style={cardStyles.textPreview}>
          {artifact.quote ? (
            <p style={cardStyles.quoteText}>"{artifact.quote}"</p>
          ) : isNote && artifact.body ? (
            <p style={cardStyles.bodyText}>{artifact.body}</p>
          ) : artifact.note ? (
            <p style={cardStyles.bodyText}>{artifact.note}</p>
          ) : null}
        </div>
      )}

      {/* Icon-only card: no image, no text */}
      {!imageSrc && !hasText && (
        <div style={cardStyles.iconArea}>
          {artifact.favicon_url ? (
            <img
              src={artifact.favicon_url}
              alt=""
              style={cardStyles.faviconLarge}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "";
              }}
            />
          ) : null}
          <span
            style={{
              ...cardStyles.iconEmoji,
              ...(artifact.favicon_url ? { display: "none" } : {}),
            }}
          >
            {typeInfo.emoji}
          </span>
        </div>
      )}

      {/* Metadata footer */}
      <div style={cardStyles.body}>
        <p style={cardStyles.title}>{title}</p>
        <div style={cardStyles.meta}>
          {!isNote && artifact.favicon_url && (
            <img
              src={artifact.favicon_url}
              alt=""
              style={cardStyles.faviconSmall}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span>{isNote ? "Note" : domain || typeInfo.label}</span>
        </div>
      </div>
    </button>
  );
}

const cardStyles: Record<string, React.CSSProperties> = {
  card: {
    breakInside: "avoid",
    marginBottom: 16,
    borderRadius: 12,
    border: "1px solid var(--paper-dark)",
    background: "var(--surface)",
    cursor: "pointer",
    overflow: "hidden",
    transition: "box-shadow 0.15s, border-color 0.15s",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    padding: 0,
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
    minHeight: 120,
    maxHeight: 320,
  },
  cardHover: {
    borderColor: "var(--forest)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  // Image thumbnail
  thumbWrap: {
    width: "100%",
    height: 140,
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

  // Text-only preview area
  textPreview: {
    padding: "14px 12px 0",
    flex: 1,
    overflow: "hidden",
    minHeight: 60,
    maxHeight: 140,
  },
  quoteText: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },
  bodyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  },

  // Icon-only area (no image, no text)
  iconArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    background: "var(--paper)",
    flexShrink: 0,
  },
  faviconLarge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    objectFit: "contain" as const,
  },
  iconEmoji: {
    fontSize: 28,
  },

  // Metadata body
  body: {
    padding: "10px 12px 12px",
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
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
    fontSize: 11,
    color: "var(--ink-light)",
    marginTop: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  faviconSmall: {
    width: 14,
    height: 14,
    borderRadius: 2,
    flexShrink: 0,
    objectFit: "contain" as const,
  },
};
