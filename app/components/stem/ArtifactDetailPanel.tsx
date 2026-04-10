import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { getDomain, formatRelative, extractYouTubeId } from "~/lib/utils";
import { track } from "~/lib/analytics";
import { styles } from "./stem-styles";
import { ARTIFACT_TYPES, artifactTypeLabel } from "./ArtifactCard";
import type { Artifact } from "./types";

/**
 * Full-tab artifact viewer. Takes over the entire content area of the finder.
 *
 * For link artifacts: shows iframe by default (the "tab" experience).
 * For notes/images/PDFs: shows the content filling the space.
 * A toolbar at top has: back button, title, domain, open-in-new-tab, edit/delete.
 */
export function ArtifactDetailPanel({
  artifact,
  stemId,
  stemUserId,
  stemUsername,
  currentUserId,
  isOwner,
  onClose,
  isMobile,
}: {
  artifact: Artifact;
  stemId: string;
  stemUserId: string;
  stemUsername: string;
  currentUserId: string | undefined;
  isOwner: boolean;
  onClose: () => void;
  isMobile?: boolean;
}) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();
  const reportFetcher = useFetcher<{ reported?: boolean }>();

  const canEdit = currentUserId === artifact.added_by || currentUserId === stemUserId;
  const canReport = !!currentUserId && currentUserId !== artifact.added_by;
  const reported = reportFetcher.data?.reported === true;

  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(artifact.note ?? "");
  const [editQuote, setEditQuote] = useState(artifact.quote ?? "");
  const [editType, setEditType] = useState(artifact.source_type);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setEditing(false);
    setEditNote(artifact.note ?? "");
    setEditQuote(artifact.quote ?? "");
    setEditType(artifact.source_type);
    setIframeError(false);
  }, [artifact.id]);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.success) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  const isNote = artifact.source_type === "note";
  const isFile = !!artifact.file_key;
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);
  const showContributor = artifact.contributor_username !== stemUsername;
  const embedId = artifact.source_type === "youtube" && artifact.url ? extractYouTubeId(artifact.url) : null;
  const embedUrl = artifact.embed_url || (embedId ? `https://www.youtube.com/embed/${embedId}` : null);
  const hasUrl = !!artifact.url;
  // Can we show this as an iframe? Links (not notes, not files) with a URL
  const canEmbed = hasUrl && !isNote && !isFile;

  const isDeleting =
    deleteFetcher.state !== "idle" &&
    deleteFetcher.formData?.get("artifactId") === artifact.id;
  if (isDeleting) {
    onClose();
    return null;
  }

  return (
    <div style={panelStyles.container}>
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={panelStyles.toolbar}>
        <button onClick={onClose} style={panelStyles.backBtn} title="Back to list">
          {"\u2190"}
        </button>

        <div style={panelStyles.toolbarCenter}>
          {domain && (
            <span style={panelStyles.toolbarDomain}>
              {artifact.favicon_url && (
                <img src={artifact.favicon_url} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
              )}
              {domain}
            </span>
          )}
          {!domain && (
            <span style={panelStyles.toolbarTitle}>
              {typeInfo.emoji} {artifact.title || typeInfo.label}
            </span>
          )}
        </div>

        <div style={panelStyles.toolbarActions}>
          {hasUrl && (
            <a
              href={artifact.url!}
              target="_blank"
              rel="noopener noreferrer"
              style={panelStyles.toolbarBtn}
              title="Open in new tab"
              onClick={() => track("open_link", { stem_id: stemId, artifact_id: artifact.id })}
            >
              {"\u2197"}
            </a>
          )}
          {canEdit && (
            <button
              onClick={() => { setEditing((e) => !e); setEditNote(artifact.note ?? ""); setEditQuote(artifact.quote ?? ""); setEditType(artifact.source_type); }}
              style={panelStyles.toolbarBtn}
              title="Edit"
            >
              {"\u270E"}
            </button>
          )}
          {canEdit && (
            <deleteFetcher.Form method="post" style={{ display: "inline" }}>
              <input type="hidden" name="intent" value="delete_artifact" />
              <input type="hidden" name="artifactId" value={artifact.id} />
              <button type="submit" style={{ ...panelStyles.toolbarBtn, color: "var(--taken, #c0392b)" }} title="Delete">
                {"\u2715"}
              </button>
            </deleteFetcher.Form>
          )}
          {canReport && !canEdit && (
            reported ? (
              <span style={{ ...panelStyles.toolbarBtn, cursor: "default", opacity: 0.5 }}>Reported</span>
            ) : (
              <reportFetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="intent" value="report_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={panelStyles.toolbarBtn} title="Report">{"\u2691"}</button>
              </reportFetcher.Form>
            )
          )}
          <button onClick={onClose} style={panelStyles.toolbarBtn} title="Close">
            {"\u2715"}
          </button>
        </div>
      </div>

      {/* ── Edit bar (shown inline below toolbar) ───────────────── */}
      {editing && (
        <div style={panelStyles.editBar}>
          <editFetcher.Form method="post" style={panelStyles.editForm}>
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
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                name="note"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Note"
                style={{ ...styles.noteInput, flex: 1, boxSizing: "border-box" as const }}
              />
              <input
                type="text"
                name="quote"
                value={editQuote}
                onChange={(e) => setEditQuote(e.target.value)}
                placeholder="Quote"
                style={{ ...styles.noteInput, flex: 1, boxSizing: "border-box" as const }}
              />
              <button type="submit" disabled={editFetcher.state !== "idle"} style={styles.settingsSaveBtn}>
                {editFetcher.state !== "idle" ? "Saving\u2026" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={styles.subtleBtn}>Cancel</button>
            </div>
            {editFetcher.data?.error && (
              <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>{editFetcher.data.error}</p>
            )}
          </editFetcher.Form>
        </div>
      )}

      {/* ── Main content area ───────────────────────────────────── */}
      <div style={panelStyles.content}>
        {/* LINK artifacts: iframe fills the space */}
        {canEmbed && !iframeError && (
          embedUrl ? (
            <iframe
              src={embedUrl}
              style={panelStyles.iframe}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <iframe
              src={artifact.url!}
              style={panelStyles.iframe}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                try {
                  const frame = e.target as HTMLIFrameElement;
                  if (frame.contentDocument === null && frame.contentWindow === null) {
                    setIframeError(true);
                  }
                } catch { /* cross-origin — normal */ }
              }}
            />
          )
        )}

        {/* Iframe error fallback */}
        {canEmbed && iframeError && (
          <div style={panelStyles.fallback}>
            {artifact.image_url && (
              <img
                src={artifact.image_url}
                alt=""
                style={{ maxWidth: 480, width: "100%", borderRadius: 12, marginBottom: 24 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <h2 style={panelStyles.fallbackTitle}>{artifact.title || artifact.url}</h2>
            {artifact.description && (
              <p style={panelStyles.fallbackDesc}>{artifact.description}</p>
            )}
            {artifact.note && (
              <p style={panelStyles.fallbackNote}>{artifact.note}</p>
            )}
            {artifact.quote && (
              <blockquote style={panelStyles.fallbackQuote}>"{artifact.quote}"</blockquote>
            )}
            <div style={panelStyles.fallbackMeta}>
              {showContributor && <span>via @{artifact.contributor_username}</span>}
              <span>{formatRelative(artifact.created_at)}</span>
            </div>
            <p style={panelStyles.fallbackMsg}>This site can't be embedded</p>
            <a
              href={artifact.url!}
              target="_blank"
              rel="noopener noreferrer"
              style={panelStyles.fallbackLink}
              onClick={() => track("open_link", { stem_id: stemId, artifact_id: artifact.id })}
            >
              Open in new tab {"\u2197"}
            </a>
          </div>
        )}

        {/* NOTE artifacts: full content display */}
        {isNote && (
          <div style={panelStyles.richContent}>
            <h2 style={panelStyles.richTitle}>{artifact.title || "Note"}</h2>
            {artifact.body && (
              <div style={panelStyles.richBody}>{artifact.body}</div>
            )}
            <div style={panelStyles.richMeta}>
              {showContributor && <span>via @{artifact.contributor_username}</span>}
              <span>{formatRelative(artifact.created_at)}</span>
            </div>
          </div>
        )}

        {/* IMAGE artifacts */}
        {isFile && artifact.source_type === "image" && (
          <div style={panelStyles.imageContent}>
            <img
              src={`https://api.stem.md/files/${artifact.file_key}`}
              alt={artifact.title || "Uploaded image"}
              style={panelStyles.fullImage}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {(artifact.title || artifact.note) && (
              <div style={panelStyles.imageCaption}>
                {artifact.title && <h3 style={{ margin: 0, fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>{artifact.title}</h3>}
                {artifact.note && <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ink-mid)" }}>{artifact.note}</p>}
              </div>
            )}
          </div>
        )}

        {/* PDF artifacts */}
        {isFile && artifact.source_type === "pdf" && (
          <div style={panelStyles.richContent}>
            <h2 style={panelStyles.richTitle}>{artifact.title || "PDF Document"}</h2>
            {artifact.note && <p style={{ fontSize: 15, color: "var(--ink-mid)", lineHeight: 1.6, marginBottom: 24 }}>{artifact.note}</p>}
            <a
              href={`https://api.stem.md/files/${artifact.file_key}`}
              target="_blank"
              rel="noopener noreferrer"
              style={panelStyles.fallbackLink}
            >
              Open PDF {"\u2197"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const panelStyles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface)",
  },

  // ── Toolbar ──────────────────────────────────────────────────
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    flexShrink: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "var(--ink-mid)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    lineHeight: 1,
    flexShrink: 0,
  },
  toolbarCenter: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarDomain: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "var(--ink-mid)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  toolbarTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  toolbarBtn: {
    background: "none",
    border: "none",
    fontSize: 15,
    color: "var(--ink-mid)",
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: 6,
    textDecoration: "none",
    fontFamily: "inherit",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
  },

  // ── Edit bar ─────────────────────────────────────────────────
  editBar: {
    padding: "12px 20px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper-mid)",
    flexShrink: 0,
  },
  editForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },

  // ── Content area ─────────────────────────────────────────────
  content: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column" as const,
  },
  iframe: {
    width: "100%",
    flex: 1,
    border: "none",
    background: "#fff",
  },

  // ── Fallback (iframe failed) ─────────────────────────────────
  fallback: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    textAlign: "center" as const,
    maxWidth: 600,
    margin: "0 auto",
  },
  fallbackTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    fontWeight: 400,
    color: "var(--ink)",
    margin: 0,
    marginBottom: 12,
  },
  fallbackDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    margin: 0,
    marginBottom: 16,
  },
  fallbackNote: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    fontStyle: "italic",
    borderLeft: "3px solid var(--forest)",
    paddingLeft: 14,
    margin: 0,
    marginBottom: 16,
    textAlign: "left" as const,
    alignSelf: "stretch",
  },
  fallbackQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 16,
    color: "var(--ink-mid)",
    fontStyle: "italic",
    borderLeft: "3px solid var(--paper-dark)",
    paddingLeft: 14,
    margin: 0,
    marginBottom: 16,
    textAlign: "left" as const,
    alignSelf: "stretch",
  },
  fallbackMeta: {
    display: "flex",
    gap: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginBottom: 24,
  },
  fallbackMsg: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    margin: 0,
    marginBottom: 12,
  },
  fallbackLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: "var(--forest)",
    textDecoration: "none",
    padding: "10px 24px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 10,
  },

  // ── Rich content (notes, fallback) ───────────────────────────
  richContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    maxWidth: 640,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  richTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    margin: 0,
    marginBottom: 20,
    textAlign: "center" as const,
  },
  richBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    color: "var(--ink)",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap" as const,
    width: "100%",
    marginBottom: 24,
  },
  richMeta: {
    display: "flex",
    gap: 12,
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },

  // ── Image content ────────────────────────────────────────────
  imageContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  fullImage: {
    maxWidth: "100%",
    maxHeight: "80%",
    objectFit: "contain" as const,
    borderRadius: 8,
  },
  imageCaption: {
    marginTop: 16,
    textAlign: "center" as const,
  },
};
