import { Marked } from "marked";

/**
 * Safe markdown renderer for notes.
 *
 * Notes are stored as markdown (user-editable, portable). We render them with
 * a custom renderer that:
 *   - Drops all raw HTML (<script>, <iframe>, `<img onerror>`, etc.) so
 *     nothing unsafe can slip through even if someone edits the DB directly.
 *   - Validates link and image URLs — only http(s) and mailto schemes pass,
 *     anything else (javascript:, data:, file:, etc.) becomes plain text.
 *   - Forces target="_blank" + rel="noopener noreferrer" on every link.
 *
 * Pure-JS; works in both SSR (Pages Functions) and the browser.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  } as Record<string, string>)[c]!);
}

function isSafeUrl(href: string | null | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href) || /^mailto:/i.test(href);
}

const noteMarked = new Marked({ gfm: true, breaks: false });

noteMarked.use({
  renderer: {
    // Drop raw HTML tokens entirely.
    html(): string {
      return "";
    },
    // Sanitize link URLs and always open links in a new tab.
    // Falls back to the default renderer for inline-text parsing of the
    // link text so bold/italic inside a link still renders correctly.
    link(token) {
      // `this` here is the renderer instance with access to the parser.
      // TypeScript's marked types don't surface that, so we cast.
      const self = this as unknown as {
        parser: { parseInline: (t: unknown) => string };
      };
      const inner = self.parser.parseInline(token.tokens);
      if (!isSafeUrl(token.href)) return inner;
      const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<a href="${escapeHtml(token.href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${inner}</a>`;
    },
    image(token) {
      if (!isSafeUrl(token.href)) return escapeHtml(token.text ?? "");
      const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text ?? "")}" loading="lazy"${titleAttr} />`;
    },
  },
});

/** Convert a note's stored markdown to safe HTML for display. */
export function renderNoteMarkdown(md: string | null | undefined): string {
  if (!md) return "";
  try {
    return noteMarked.parse(md, { async: false }) as string;
  } catch {
    return `<p>${escapeHtml(md)}</p>`;
  }
}
