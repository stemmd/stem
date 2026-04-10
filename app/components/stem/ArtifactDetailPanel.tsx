import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { getDomain, formatRelative, extractYouTubeId } from "~/lib/utils";
import { track } from "~/lib/analytics";
import { styles } from "./stem-styles";
import { ARTIFACT_TYPES, artifactTypeLabel } from "./ArtifactCard";
import { IframeViewer } from "./IframeViewer";
import type { Artifact } from "./types";

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
  const [showIframe, setShowIframe] = useState(false);

  // Reset edit state when artifact changes
  useEffect(() => {
    setEditing(false);
    setEditNote(artifact.note ?? "");
    setEditQuote(artifact.quote ?? "");
    setEditType(artifact.source_type);
    setShowIframe(false);
  }, [artifact.id]);

  // Close edit panel after save
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

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isDeleting =
    deleteFetcher.state !== "idle" &&
    deleteFetcher.formData?.get("artifactId") === artifact.id;
  if (isDeleting) {
    onClose();
    return null;
  }

  return (
    <div style={{
      ...panelStyles.container,
      ...(isMobile ? panelStyles.mobile : {}),
    }}>
      {/* Header bar */}
      <div style={panelStyles.header}>
        <span style={panelStyles.typeBadge}>{typeInfo.emoji} {typeInfo.label}</span>
        <button onClick={onClose} style={panelStyles.closeBtn} title="Close">{"\u2715"}</button>
      </div>

      {/* Content */}
      <div style={panelStyles.body}>
        {/* Embed / Image */}
        {!isNote && !isFile && embedUrl && !showIframe && (
          <iframe
            src={embedUrl}
            style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 8, marginBottom: 16 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {!isNote && !isFile && !embedUrl && artifact.image_url && !showIframe && (
          <img
            src={artifact.image_url}
            alt=""
            style={{ width: "100%", borderRadius: 8, marginBottom: 16, display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        {isFile && artifact.source_type === "image" && (
          <img
            src={`https://api.stem.md/files/${artifact.file_key}`}
            alt={artifact.title || "Uploaded image"}
            style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 16, display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}

        {/* Iframe viewer (toggled) */}
        {showIframe && artifact.url && (
          <IframeViewer url={artifact.url} onClose={() => setShowIframe(false)} />
        )}

        {/* Title */}
        {!showIframe && (
          <>
            <h3 style={panelStyles.title}>
              {artifact.url ? (
                <a
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                  onClick={() => track("open_link", { stem_id: stemId, artifact_id: artifact.id })}
                >
                  {artifact.title || artifact.url}
                </a>
              ) : (
                artifact.title || "Untitled"
              )}
            </h3>

            {/* Description */}
            {artifact.description && (
              <p style={panelStyles.description}>{artifact.description}</p>
            )}

            {/* Note body (for note-type artifacts) */}
            {isNote && artifact.body && (
              <div style={panelStyles.noteBody}>{artifact.body}</div>
            )}

            {/* Curator note */}
            {artifact.note && (
              <p style={panelStyles.note}>{artifact.note}</p>
            )}

            {/* Quote */}
            {artifact.quote && (
              <blockquote style={panelStyles.quote}>"{artifact.quote}"</blockquote>
            )}

            {/* File info */}
            {isFile && artifact.source_type === "pdf" && (
              <a
                href={`https://api.stem.md/files/${artifact.file_key}`}
                target="_blank"
                rel="noopener noreferrer"
                style={panelStyles.fileLink}
              >
                {"\uD83D\uDCC4"} {artifact.title || "Download PDF"}
                {artifact.file_size ? ` (${formatBytes(artifact.file_size)})` : ""}
              </a>
            )}

            {/* Meta row */}
            <div style={panelStyles.metaRow}>
              {domain && (
                <span style={panelStyles.domain}>
                  {artifact.favicon_url && (
                    <img src={artifact.favicon_url} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
                  )}
                  {domain}
                </span>
              )}
              {showContributor && (
                <span style={panelStyles.contributor}>via @{artifact.contributor_username}</span>
              )}
              <span style={panelStyles.timestamp}>{formatRelative(artifact.created_at)}</span>
            </div>

            {/* Open in Stem button (for link-type artifacts) */}
            {hasUrl && !isNote && !isFile && !showIframe && (
              <button
                onClick={() => setShowIframe(true)}
                style={panelStyles.openInStemBtn}
              >
                Open in Stem {"\u25B6"}
              </button>
            )}

            {/* Actions */}
            <div style={panelStyles.actions}>
              {hasUrl && (
                <a
                  href={artifact.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={panelStyles.actionLink}
                  onClick={() => track("open_link", { stem_id: stemId, artifact_id: artifact.id })}
                >
                  Open in new tab {"\u2197"}
                </a>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => { setEditing((e) => !e); setEditNote(artifact.note ?? ""); setEditQuote(artifact.quote ?? ""); setEditType(artifact.source_type); }}
                  style={panelStyles.actionBtn}
                >
                  {editing ? "Cancel edit" : "Edit"}
                </button>
              )}

              {canEdit && (
                <deleteFetcher.Form method="post" style={{ display: "inline" }}>
                  <input type="hidden" name="intent" value="delete_artifact" />
                  <input type="hidden" name="artifactId" value={artifact.id} />
                  <button type="submit" style={{ ...panelStyles.actionBtn, color: "var(--taken, #c0392b)" }}>
                    Delete
                  </button>
                </deleteFetcher.Form>
              )}

              {canReport && !canEdit && (
                reported ? (
                  <span style={panelStyles.reportedLabel}>Reported</span>
                ) : (
                  <reportFetcher.Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="report_artifact" />
                    <input type="hidden" name="artifactId" value={artifact.id} />
                    <button type="submit" style={panelStyles.actionBtn}>Report</button>
                  </reportFetcher.Form>
                )
              )}
            </div>

            {/* Edit form */}
            {editing && (
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
                    {editFetcher.state !== "idle" ? "Saving\u2026" : "Save"}
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
          </>
        )}
      </div>
    </div>
  );
}

const panelStyles: Record<string, React.CSSProperties> = {
  container: {
    width: 380,
    minWidth: 320,
    flexShrink: 0,
    borderLeft: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    animation: "fadeIn 0.15s ease-out",
  },
  mobile: {
    width: "100%",
    borderLeft: "none",
    flex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid var(--paper-dark)",
    flexShrink: 0,
  },
  typeBadge: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--ink-mid)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 4,
  },
  body: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 20,
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 18,
    fontWeight: 600,
    color: "var(--ink)",
    lineHeight: 1.35,
    margin: 0,
    marginBottom: 12,
  },
  description: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 12,
  },
  noteBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
    marginBottom: 16,
  },
  note: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.5,
    fontStyle: "italic",
    borderLeft: "3px solid var(--forest)",
    paddingLeft: 12,
    margin: 0,
    marginBottom: 12,
  },
  quote: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    fontStyle: "italic",
    borderLeft: "3px solid var(--paper-dark)",
    paddingLeft: 14,
    lineHeight: 1.5,
    margin: 0,
    marginLeft: 0,
    marginBottom: 16,
  },
  fileLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--forest)",
    textDecoration: "none",
    marginBottom: 16,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingTop: 12,
    borderTop: "1px solid var(--paper-dark)",
  },
  domain: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  contributor: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  timestamp: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  openInStemBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "12px 16px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--forest)",
    marginBottom: 16,
    transition: "background 0.12s",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 12,
    marginBottom: 16,
  },
  actionLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--forest)",
    textDecoration: "none",
    fontWeight: 500,
  },
  actionBtn: {
    background: "none",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
    textDecorationColor: "var(--paper-dark)",
  },
  reportedLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  editForm: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    marginTop: 8,
    padding: 16,
    background: "var(--surface)",
    borderRadius: 10,
    border: "1px solid var(--paper-dark)",
  },
};
