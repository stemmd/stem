import { useState } from "react";
import { getDomain } from "~/lib/utils";

/**
 * Embedded iframe viewer with a mini toolbar.
 * Shows the URL, a close button, and an open-in-new-tab button.
 * Handles sites that refuse framing with a fallback message.
 */
export function IframeViewer({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [loadError, setLoadError] = useState(false);
  const domain = getDomain(url);

  if (loadError) {
    return (
      <div style={iframeStyles.fallback}>
        <p style={iframeStyles.fallbackText}>
          This site can't be embedded.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={iframeStyles.fallbackLink}
        >
          Open in new tab {"\u2197"}
        </a>
        <button onClick={onClose} style={iframeStyles.fallbackClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={iframeStyles.container}>
      {/* Toolbar */}
      <div style={iframeStyles.toolbar}>
        <span style={iframeStyles.domainLabel}>{domain}</span>
        <div style={iframeStyles.toolbarActions}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={iframeStyles.toolbarBtn}
            title="Open in new tab"
          >
            {"\u2197"}
          </a>
          <button onClick={onClose} style={iframeStyles.toolbarBtn} title="Close viewer">
            {"\u2715"}
          </button>
        </div>
      </div>

      {/* Iframe */}
      <iframe
        src={url}
        style={iframeStyles.iframe}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        onError={() => setLoadError(true)}
        onLoad={(e) => {
          // Try to detect X-Frame-Options failures
          // Note: cross-origin iframes won't give us access to contentDocument,
          // so we rely on the browser's built-in error handling
          try {
            const frame = e.target as HTMLIFrameElement;
            // If we can access contentDocument and it's empty/null, loading likely failed
            if (frame.contentDocument === null && frame.contentWindow === null) {
              setLoadError(true);
            }
          } catch {
            // Cross-origin — normal, iframe loaded something
          }
        }}
      />
    </div>
  );
}

const iframeStyles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "var(--paper-mid)",
    borderBottom: "1px solid var(--paper-dark)",
  },
  domainLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-mid)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
    minWidth: 0,
  },
  toolbarActions: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
    marginLeft: 8,
  },
  toolbarBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    color: "var(--ink-mid)",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: 4,
    textDecoration: "none",
    fontFamily: "inherit",
    lineHeight: 1,
  },
  iframe: {
    width: "100%",
    height: 400,
    border: "none",
    background: "#fff",
  },
  fallback: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
    padding: "32px 20px",
    background: "var(--paper-mid)",
    borderRadius: 10,
    marginBottom: 16,
  },
  fallbackText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    margin: 0,
  },
  fallbackLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--forest)",
    textDecoration: "none",
  },
  fallbackClose: {
    background: "none",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationColor: "var(--paper-dark)",
  },
};
