import { useEffect, useRef, useState } from "react";
import type { Artifact } from "./types";
import { extractYouTubeId, getDomain } from "~/lib/utils";
import { API_BASE } from "~/lib/config";

interface ReaderArticle {
  title: string | null;
  byline: string | null;
  siteName: string | null;
  length: number;
  excerpt: string | null;
  content: string;
  publishedTime: string | null;
  lang: string | null;
  direction: string | null;
  sourceUrl: string;
  domain: string;
}

type ReaderState =
  | { kind: "loading" }
  | { kind: "reader"; article: ReaderArticle }
  | { kind: "iframe"; src: string; allowSandbox: boolean }
  | { kind: "tab-opened" };

/**
 * Domains where we know reader mode is a nicer experience than the iframe
 * (heavy chrome, narrow reading column, distractions). The iframe would work,
 * but the reader feels better — skip the frame-check and go straight to extract.
 */
const READER_FIRST_HOSTS = [
  "wikipedia.org",
  "nature.com",
  "arxiv.org",
];

/**
 * Minimum extracted-text length for reader mode to be considered a good result.
 * Anything shorter usually means we landed on a nav page, paywall stub, or
 * video-centric page (TED, etc.) and extraction didn't capture real content.
 * Below this threshold we skip straight to opening the URL in a new tab.
 */
const READER_MIN_LENGTH = 500;

function hostMatches(host: string, domain: string): boolean {
  host = host.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

function isReaderFirst(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return READER_FIRST_HOSTS.some((d) => hostMatches(host, d));
  } catch {
    return false;
  }
}

/** Classify the artifact into one of the three primary view modes, ignoring whitelist. */
function primaryMode(artifact: Artifact): { kind: "embed"; src: string } | { kind: "pdf"; src: string } | { kind: "web"; url: string } | null {
  const type = artifact.source_type;
  const mime = artifact.file_mime ?? "";

  if (artifact.file_key) {
    const src = `https://api.stem.md/files/${artifact.file_key}`;
    if (type === "pdf" || mime === "application/pdf") return { kind: "pdf", src };
    return null; // images/notes/files render inline, no reader needed
  }

  if (!artifact.url) return null;
  const url = artifact.url;
  const lower = url.toLowerCase();

  const youtubeId = type === "youtube" ? extractYouTubeId(url) : null;
  const embedUrl = artifact.embed_url || (youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null);
  if (embedUrl) return { kind: "embed", src: embedUrl };

  if (type === "pdf" || mime === "application/pdf" || lower.endsWith(".pdf")) {
    return { kind: "pdf", src: url };
  }

  return { kind: "web", url };
}

async function fetchFrameCheck(url: string, signal: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/frame-check?url=${encodeURIComponent(url)}`, { signal });
    const data = (await res.json()) as { canFrame?: boolean };
    return data.canFrame === true;
  } catch {
    return false;
  }
}

async function fetchReader(url: string, signal: AbortSignal): Promise<ReaderArticle | null> {
  try {
    const res = await fetch(`${API_BASE}/reader?url=${encodeURIComponent(url)}`, { signal });
    const data = (await res.json()) as { success?: boolean; article?: ReaderArticle };
    if (data.success && data.article && (data.article.length ?? 0) >= READER_MIN_LENGTH) {
      return data.article;
    }
    return null;
  } catch {
    return null;
  }
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ArtifactReader({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  const [state, setState] = useState<ReaderState>({ kind: "loading" });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setState({ kind: "loading" });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

    const mode = primaryMode(artifact);
    if (!mode) {
      onClose();
      return;
    }

    // Known-good embeds (YouTube, Vimeo, Twitter video, anything with embed_url): iframe directly.
    if (mode.kind === "embed") {
      setState({ kind: "iframe", src: mode.src, allowSandbox: false });
      return;
    }

    // PDFs: iframe to the browser's native PDF viewer (no sandbox — breaks PDF rendering).
    if (mode.kind === "pdf") {
      setState({ kind: "iframe", src: mode.src, allowSandbox: false });
      return;
    }

    // web: go through the full iframe -> reader -> tab fallback chain.
    const run = async () => {
      const url = mode.url;

      // 1. Text-heavy whitelist: go straight to reader.
      if (isReaderFirst(url)) {
        const article = await fetchReader(url, controller.signal);
        if (cancelled) return;
        if (article) {
          setState({ kind: "reader", article });
          return;
        }
        // Reader failed even though we were confident — open tab.
        openInNewTab(url);
        setState({ kind: "tab-opened" });
        onClose();
        return;
      }

      // 2. Iframe first (check headers server-side).
      const canFrame = await fetchFrameCheck(url, controller.signal);
      if (cancelled) return;
      if (canFrame) {
        setState({ kind: "iframe", src: url, allowSandbox: true });
        return;
      }

      // 3. Iframe blocked: try reader.
      const article = await fetchReader(url, controller.signal);
      if (cancelled) return;
      if (article) {
        setState({ kind: "reader", article });
        return;
      }

      // 4. Last resort: open in a new tab.
      openInNewTab(url);
      setState({ kind: "tab-opened" });
      onClose();
    };
    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-run the pipeline when the artifact identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact.id]);

  // Esc closes the reader.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // If an iframe fails client-side (e.g. sandbox issues we couldn't predict), fall back to reader.
  const onIframeError = () => {
    if (state.kind !== "iframe" || !artifact.url) return;
    const url = artifact.url;
    // Ignore for embed (YouTube etc.) — those rarely fail silently.
    if (!state.allowSandbox) return;
    (async () => {
      const article = await fetchReader(url, new AbortController().signal);
      if (article) {
        setState({ kind: "reader", article });
      } else {
        openInNewTab(url);
        onClose();
      }
    })();
  };

  const originalUrl = artifact.url ?? (artifact.file_key ? `https://api.stem.md/files/${artifact.file_key}` : "");
  const domain = originalUrl ? getDomain(originalUrl) : "";

  return (
    <aside style={readerStyles.panel} aria-label="Artifact reader">
      <header style={readerStyles.header}>
        <button type="button" onClick={onClose} style={readerStyles.closeBtn} title="Back to stem (Esc)">
          <span style={readerStyles.closeArrow}>{"\u2190"}</span>
          <span>Back to stem</span>
        </button>

        <div style={readerStyles.headerCenter}>
          {artifact.favicon_url && (
            <img src={artifact.favicon_url} alt="" draggable={false} style={readerStyles.headerFavicon} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <span style={readerStyles.headerDomain}>{domain}</span>
        </div>

        <a
          href={originalUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={readerStyles.openTabBtn}
          title="Open in new tab"
          aria-label="Open in new tab"
        >
          {"\u2197"}
        </a>
      </header>

      <div ref={scrollRef} style={readerStyles.scroll}>
        {state.kind === "loading" && (
          <div style={readerStyles.loadingWrap}>
            <div style={readerStyles.loadingLeaf} aria-hidden="true" />
            <p style={readerStyles.loadingText}>Unfurling the page</p>
          </div>
        )}

        {state.kind === "reader" && (
          <article style={readerStyles.article}>
            <div style={readerStyles.articleInner}>
              {state.article.title && <h1 style={readerStyles.articleTitle}>{state.article.title}</h1>}
              <div style={readerStyles.articleMeta}>
                {state.article.byline && <span>{state.article.byline}</span>}
                {state.article.byline && state.article.publishedTime && <span style={readerStyles.articleMetaSep}>·</span>}
                {state.article.publishedTime && <span>{formatPublished(state.article.publishedTime)}</span>}
                {state.article.length > 0 && (
                  <>
                    {(state.article.byline || state.article.publishedTime) && <span style={readerStyles.articleMetaSep}>·</span>}
                    <span>{Math.max(1, Math.ceil(state.article.length / 1400))} min read</span>
                  </>
                )}
              </div>
              {/* Content was sanitized server-side by the Worker before it was
                  returned, so we can render directly. */}
              <div
                className="stem-reader-content"
                style={readerStyles.articleBody}
                dangerouslySetInnerHTML={{ __html: state.article.content }}
              />
            </div>
          </article>
        )}

        {state.kind === "iframe" && (
          <iframe
            key={state.src}
            src={state.src}
            style={readerStyles.iframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox={state.allowSandbox ? "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" : undefined}
            onError={onIframeError}
            title={artifact.title || "Embedded content"}
          />
        )}
      </div>
    </aside>
  );
}

function formatPublished(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

const readerStyles: Record<string, React.CSSProperties> = {
  panel: {
    flex: 1,
    minWidth: 0,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--paper)",
    borderLeft: "1px solid var(--paper-dark)",
    animation: "fadeUp 0.28s ease-out",
  },

  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 24px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    minHeight: 56,
    boxSizing: "border-box",
  },

  closeBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 14px",
    background: "transparent",
    border: "1px solid var(--paper-dark)",
    borderRadius: 999,
    color: "var(--ink-mid)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
  },

  closeArrow: {
    fontSize: 14,
    lineHeight: 1,
  },

  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    overflow: "hidden",
  },

  headerFavicon: {
    width: 14,
    height: 14,
    flexShrink: 0,
  },

  headerDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  openTabBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    padding: 0,
    borderRadius: 999,
    background: "transparent",
    border: "1px solid var(--paper-dark)",
    color: "var(--ink-mid)",
    fontSize: 16,
    textDecoration: "none",
    flexShrink: 0,
    transition: "background 0.15s, color 0.15s",
  },

  scroll: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    background: "var(--paper)",
  },

  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: 18,
  },

  loadingLeaf: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "var(--forest)",
    opacity: 0.5,
    animation: "pulse 1.4s ease-in-out infinite",
  },

  loadingText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    fontStyle: "italic",
  },

  iframe: {
    display: "block",
    width: "100%",
    height: "100%",
    border: "none",
    minHeight: "calc(100vh - 56px)",
    background: "var(--surface)",
  },

  article: {
    padding: "48px 32px 96px",
    maxWidth: "100%",
  },

  articleInner: {
    maxWidth: 720,
    margin: "0 auto",
  },

  articleTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 400,
    lineHeight: 1.18,
    color: "var(--ink)",
    margin: "0 0 14px",
    letterSpacing: "-0.01em",
  },

  articleMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 36,
    paddingBottom: 18,
    borderBottom: "1px solid var(--paper-dark)",
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
  },

  articleMetaSep: {
    opacity: 0.6,
  },

  articleBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 17,
    lineHeight: 1.75,
    color: "var(--ink)",
  },
};
