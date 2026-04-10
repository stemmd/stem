import { useEffect, useRef } from "react";
import { AddArtifactForm } from "./AddArtifactForm";
import { AddNodeForm } from "./AddNodeForm";

type ModalTab = "artifact" | "node";

/**
 * Modal overlay for adding items to a stem.
 * Wraps existing AddArtifactForm and AddNodeForm in a modal context.
 */
export function AddItemModal({
  stemId,
  isOwner,
  stemUsername,
  contributionMode,
  canUpload,
  nodeId,
  initialTab,
  onClose,
}: {
  stemId: string;
  isOwner: boolean;
  stemUsername: string;
  contributionMode: string;
  canUpload: boolean;
  nodeId: string | null;
  initialTab?: ModalTab;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const tab = initialTab ?? "artifact";

  return (
    <div ref={backdropRef} style={modalStyles.backdrop} onClick={handleBackdropClick}>
      <div style={modalStyles.card}>
        {/* Header */}
        <div style={modalStyles.header}>
          <span style={modalStyles.headerTitle}>
            {tab === "node" ? "Add node" : "Add to stem"}
            {nodeId && <span style={modalStyles.headerContext}> (inside current node)</span>}
          </span>
          <button onClick={onClose} style={modalStyles.closeBtn}>{"\u2715"}</button>
        </div>

        {/* Content */}
        <div style={modalStyles.body}>
          {tab === "node" ? (
            <AddNodeForm stemId={stemId} parentId={nodeId} />
          ) : (
            <AddArtifactForm
              stemId={stemId}
              isOwner={isOwner}
              stemUsername={stemUsername}
              contributionMode={contributionMode}
              canUpload={canUpload}
              nodeId={nodeId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const modalStyles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 20,
  },
  card: {
    background: "var(--surface)",
    borderRadius: 16,
    width: "100%",
    maxWidth: 580,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
    animation: "fadeUp 0.2s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--paper-dark)",
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--ink)",
  },
  headerContext: {
    fontWeight: 400,
    fontSize: 13,
    color: "var(--ink-light)",
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
};
