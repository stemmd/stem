import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { extractYouTubeId, formatRelative, getDomain } from "~/lib/utils";
import { track } from "~/lib/analytics";
import { styles } from "./stem-styles";
import type { Artifact } from "./types";
import type { Density } from "./useDensity";
import { useReader } from "./ReaderContext";

/** True when a click event carried modifier keys the user expects to bypass custom handlers. */
function isModifierClick(e: React.MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1;
}

export const ARTIFACT_TYPES: { value: string; label: string; emoji: string }[] = [
  { value: "article", label: "Article", emoji: "📄" },
  { value: "book", label: "Book", emoji: "📖" },
  { value: "paper", label: "Paper", emoji: "🔬" },
  { value: "podcast", label: "Podcast", emoji: "🎙️" },
  { value: "video", label: "Video", emoji: "🎥" },
  { value: "tool", label: "Tool", emoji: "🔧" },
  { value: "person", label: "Person", emoji: "👤" },
  { value: "place", label: "Place", emoji: "📍" },
  { value: "concept", label: "Concept", emoji: "💭" },
  { value: "wikipedia", label: "Wikipedia", emoji: "📚" },
  { value: "note", label: "Note", emoji: "📝" },
  { value: "image", label: "Image", emoji: "🖼️" },
  { value: "pdf", label: "PDF", emoji: "📑" },
  { value: "audio", label: "Audio", emoji: "🎧" },
];

export function artifactTypeLabel(type: string): { label: string; emoji: string } {
  if (type === "youtube") return { label: "Video", emoji: "🎥" };
  if (type === "arxiv") return { label: "Paper", emoji: "🔬" };
  return ARTIFACT_TYPES.find((t) => t.value === type) ?? { label: "Article", emoji: "📄" };
}

export function ArtifactCard({
  artifact,
  stemId,
  stemUserId,
  currentUserId,
  stemUsername,
  nodeNames,
  density = "airy",
}: {
  artifact: Artifact;
  stemId: string;
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
  nodeNames?: string[];
  density?: Density;
}) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();
  const reportFetcher = useFetcher<{ reported?: boolean }>();
  const reader = useReader();
  const canEdit = currentUserId === artifact.added_by || currentUserId === stemUserId;
  const canReport = !!currentUserId && currentUserId !== artifact.added_by;
  const reported = reportFetcher.data?.reported === true;
  const isDeleting =
    deleteFetcher.state !== "idle" &&
    deleteFetcher.formData?.get("artifactId") === artifact.id;
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(artifact.note ?? "");
  const [editQuote, setEditQuote] = useState(artifact.quote ?? "");
  const [editType, setEditType] = useState(artifact.source_type);
  const [hovered, setHovered] = useState(false);

  /**
   * Default click for any artifact link: when a reader is available and the user
   * didn't hold a modifier key (cmd/ctrl/shift/alt/middle-click), intercept and
   * open the artifact inside the in-app reader. Otherwise fall through to the
   * browser's native link behavior (new tab, save, etc.).
   */
  const openArtifact = (e: React.MouseEvent) => {
    if (isModifierClick(e)) return;
    track("open_link", { stem_id: stemId, artifact_id: artifact.id });
    if (!reader) return;
    e.preventDefault();
    reader.open(artifact);
  };

  // Close edit panel after save
  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.success) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  if (isDeleting) return null;

  const isNote = artifact.source_type === "note";
  const isFileUpload = !!artifact.file_key && (artifact.source_type === "image" || artifact.source_type === "pdf");
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const showContributor = artifact.contributor_username !== stemUsername;
  const embedId = !isNote && !isFileUpload && artifact.embed_url ? null : (!isNote && !isFileUpload && artifact.source_type === "youtube" && artifact.url ? extractYouTubeId(artifact.url) : null);
  const embedUrl = !isNote && !isFileUpload ? (artifact.embed_url || (embedId ? `https://www.youtube.com/embed/${embedId}` : null)) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);

  // ── Dense render: single-row compact with hover-reveal ──
  if (density === "dense") {
    const displayTitle = artifact.title || (isNote ? (artifact.body ?? "").slice(0, 80) : null) || artifact.url || "Untitled";
    const hoverContent = artifact.note || artifact.quote || (isNote ? artifact.body : null);
    const href = isNote ? undefined : (isFileUpload ? `https://api.stem.md/files/${artifact.file_key}` : artifact.url) ?? undefined;
    const Tag = href ? "a" : "div";
    return (
      <div
        style={{ position: "relative", minWidth: 0, flex: 1 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={styles.artifactCardCompact}>
          <span style={styles.artifactCardCompactType} title={typeInfo.label}>{typeInfo.emoji}</span>
          <Tag
            {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
            draggable={false}
            style={{ ...styles.artifactCardCompactTitle, cursor: href ? "pointer" : "default" }}
            onClick={href ? openArtifact : undefined}
          >
            {displayTitle}
          </Tag>
          {domain && (
            <span style={styles.artifactCardCompactDomain}>
              {artifact.favicon_url && (
                <img src={artifact.favicon_url} alt="" draggable={false} style={{ width: 11, height: 11, flexShrink: 0 }} />
              )}
              {domain}
            </span>
          )}
          {canEdit && (
            <deleteFetcher.Form method="post" style={{ flexShrink: 0 }}>
              <input type="hidden" name="intent" value="delete_artifact" />
              <input type="hidden" name="artifactId" value={artifact.id} />
              <button type="submit" style={{ ...styles.deleteBtn, padding: "0 2px" }} title="Remove artifact">×</button>
            </deleteFetcher.Form>
          )}
        </div>
        {hovered && hoverContent && (
          <div style={styles.artifactCardCompactHover}>
            {artifact.quote ? `"${artifact.quote}"` : hoverContent}
          </div>
        )}
        {nodeNames && nodeNames.length > 0 && (
          <div style={{ ...styles.alsoInRow, marginTop: 4, paddingLeft: 12 }}>
            {nodeNames.map((name) => (
              <span key={name} style={styles.alsoInTag}>{name}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={styles.artifactCard}>
      {/* Note-type artifact */}
      {isNote && (
        <div style={styles.artifactBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={styles.artifactTypeBadge}>📝</span>
            {artifact.title && <span style={{ ...styles.artifactTitle, cursor: "default" }}>{artifact.title}</span>}
          </div>
          {artifact.body && (
            <p style={styles.noteBody}>{artifact.body}</p>
          )}
          <div style={styles.artifactFooter}>
            {showContributor && (
              <span style={styles.contributor}>by @{artifact.contributor_username}</span>
            )}
            <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
            {canEdit && (
              <deleteFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
              </deleteFetcher.Form>
            )}
          </div>
          {/* "Also in" node tags */}
          {nodeNames && nodeNames.length > 0 && (
            <div style={styles.alsoInRow}>
              <span style={styles.alsoInLabel}>Also in:</span>
              {nodeNames.map((name) => (
                <span key={name} style={styles.alsoInTag}>{name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File-type artifact (image) */}
      {isFileUpload && artifact.source_type === "image" && (
        <div style={styles.artifactBody}>
          <img
            src={`https://api.stem.md/files/${artifact.file_key}`}
            alt={artifact.title || "Uploaded image"}
            draggable={false}
            style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 8, display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {artifact.title && (
            <p style={{ ...styles.artifactTitle, cursor: "default", marginBottom: 4 }}>{artifact.title}</p>
          )}
          {artifact.note && <p style={styles.artifactNote}>{artifact.note}</p>}
          <div style={styles.artifactFooter}>
            <span style={styles.artifactTypeBadge}>🖼️</span>
            {showContributor && (
              <span style={styles.contributor}>by @{artifact.contributor_username}</span>
            )}
            <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
            {canEdit && (
              <deleteFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
              </deleteFetcher.Form>
            )}
          </div>
          {nodeNames && nodeNames.length > 0 && (
            <div style={styles.alsoInRow}>
              <span style={styles.alsoInLabel}>Also in:</span>
              {nodeNames.map((name) => (
                <span key={name} style={styles.alsoInTag}>{name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File-type artifact (PDF) */}
      {isFileUpload && artifact.source_type === "pdf" && (
        <div style={styles.artifactBody}>
          <a
            href={`https://api.stem.md/files/${artifact.file_key}`}
            target="_blank"
            rel="noopener noreferrer"
            draggable={false}
            onClick={openArtifact}
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: "12px 0" }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...styles.artifactTitle, marginBottom: 2 }}>
                {artifact.title || "Download PDF"}
              </p>
              {artifact.file_size && (
                <span style={{ fontSize: 12, color: "var(--ink-light)", fontFamily: "'DM Mono', monospace" }}>
                  {formatBytes(artifact.file_size)}
                </span>
              )}
            </div>
          </a>
          {artifact.note && <p style={styles.artifactNote}>{artifact.note}</p>}
          <div style={styles.artifactFooter}>
            <span style={styles.artifactTypeBadge}>📎</span>
            {showContributor && (
              <span style={styles.contributor}>by @{artifact.contributor_username}</span>
            )}
            <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
            {canEdit && (
              <deleteFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
              </deleteFetcher.Form>
            )}
          </div>
          {nodeNames && nodeNames.length > 0 && (
            <div style={styles.alsoInRow}>
              <span style={styles.alsoInLabel}>Also in:</span>
              {nodeNames.map((name) => (
                <span key={name} style={styles.alsoInTag}>{name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link-type artifact */}
      {!isNote && !isFileUpload && embedUrl && (
        <iframe
          src={embedUrl}
          style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 8, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      {!isNote && !isFileUpload && <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {!embedUrl && artifact.image_url && (
        <img
          src={artifact.image_url}
          alt=""
          draggable={false}
          style={styles.artifactThumb}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div style={{ ...styles.artifactBody, flex: 1 }}>
        <a
          href={artifact.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          style={styles.artifactTitle}
          onClick={openArtifact}
        >
          {artifact.title || artifact.url}
        </a>

        {artifact.note && <p style={styles.artifactNote}>{artifact.note}</p>}

        {artifact.quote && (
          <blockquote style={styles.artifactQuote}>"{artifact.quote}"</blockquote>
        )}

        <div style={styles.artifactFooter}>
          <span style={styles.artifactTypeBadge} title={typeInfo.label}>
            {typeInfo.emoji}
          </span>
          <span style={styles.artifactDomain}>
            {artifact.favicon_url && (
              <img src={artifact.favicon_url} alt="" draggable={false} style={{ width: 12, height: 12, flexShrink: 0 }} />
            )}
            {domain}
          </span>
          {showContributor && (
            <span style={styles.contributor}>via @{artifact.contributor_username}</span>
          )}
          <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
          {canReport && !canEdit && (
            reported ? (
              <span style={{ ...styles.timestamp, color: "var(--ink-light)" }}>Reported</span>
            ) : (
              <reportFetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="intent" value="report_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.reportBtn} title="Report this artifact">⚑</button>
              </reportFetcher.Form>
            )
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => { setEditing((e) => !e); setEditNote(artifact.note ?? ""); setEditQuote(artifact.quote ?? ""); setEditType(artifact.source_type); }}
              style={{ ...styles.deleteBtn, marginLeft: "auto" }}
              title="Edit artifact"
            >
              ✏
            </button>
          )}
          {canEdit && (
            <deleteFetcher.Form method="post">
              <input type="hidden" name="intent" value="delete_artifact" />
              <input type="hidden" name="artifactId" value={artifact.id} />
              <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
            </deleteFetcher.Form>
          )}
        </div>

        {/* "Also in" node tags */}
        {nodeNames && nodeNames.length > 0 && (
          <div style={styles.alsoInRow}>
            <span style={styles.alsoInLabel}>Also in:</span>
            {nodeNames.map((name) => (
              <span key={name} style={styles.alsoInTag}>{name}</span>
            ))}
          </div>
        )}

        {editing && (
          <editFetcher.Form method="post" style={styles.editForm}>
            <input type="hidden" name="intent" value="edit_artifact" />
            <input type="hidden" name="artifactId" value={artifact.id} />
            <div style={styles.typePickerRow}>
              {ARTIFACT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEditType(t.value)}
                  style={{
                    ...styles.typePill,
                    background: editType === t.value ? "var(--leaf)" : "transparent",
                    borderColor: editType === t.value ? "var(--forest)" : "var(--paper-dark)",
                    color: editType === t.value ? "var(--forest)" : "var(--ink-light)",
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="artifact_type" value={editType} />
            <input
              type="text"
              name="note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Note (optional)"
              style={{ ...styles.noteInput, width: "100%", boxSizing: "border-box" as const }}
            />
            <textarea
              name="quote"
              value={editQuote}
              onChange={(e) => setEditQuote(e.target.value)}
              placeholder="Key quote (optional)"
              maxLength={300}
              rows={2}
              style={styles.quoteInput}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={editFetcher.state !== "idle"} style={styles.settingsSaveBtn}>
                {editFetcher.state !== "idle" ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={styles.subtleBtn}>
                Cancel
              </button>
            </div>
            {editFetcher.data?.error && (
              <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>{editFetcher.data.error}</p>
            )}
          </editFetcher.Form>
        )}
      </div>
      </div>}
    </div>
  );
}
