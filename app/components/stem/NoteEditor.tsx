import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef, useCallback } from "react";
import TurndownService from "turndown";
import { Marked } from "marked";

/**
 * A rich-text editor for note artifacts.
 *
 * Storage contract: the editor produces and consumes markdown. The hosting
 * component passes an initial markdown string via `initialMarkdown` and
 * gets back markdown via `onChange`. Internally the editor works with
 * HTML (Tiptap's native format) and we convert at the boundary using
 * `marked` (md -> html, for init) and `turndown` (html -> md, on change).
 *
 * The feel should match what people expect from Notion, Bear, or a modern
 * blog editor: paragraphs by default, **bold** typed inline becomes bold,
 * `# ` at line start becomes a heading, `- ` becomes a list, Cmd/Ctrl+B
 * bolds, Cmd/Ctrl+K inserts a link. No raw markdown ever shown.
 */

const mdForEditor = new Marked({ gfm: true, breaks: false });

const turndown = new TurndownService({
  headingStyle: "atx",        // # Heading, not underlined
  bulletListMarker: "-",
  codeBlockStyle: "fenced",   // ``` fences, not indented
  emDelimiter: "*",           // *italic*, not _italic_
  linkStyle: "inlined",
  fence: "```",
});
// Make sure blockquotes survive HTML->MD cleanly.
turndown.addRule("blockquote", {
  filter: "blockquote",
  replacement: (content) => content.trim().split("\n").map((line) => `> ${line}`).join("\n") + "\n\n",
});

function markdownToHtml(md: string): string {
  if (!md) return "";
  try {
    return mdForEditor.parse(md, { async: false }) as string;
  } catch {
    return "";
  }
}

function htmlToMarkdown(html: string): string {
  try {
    return turndown.turndown(html).trim();
  } catch {
    return "";
  }
}

export function NoteEditor({
  initialMarkdown = "",
  onChange,
  placeholder = "Start writing. Use # for headings, **bold**, *italic*, - for lists.",
  autoFocus = false,
  minHeight = 120,
}: {
  initialMarkdown?: string;
  onChange?: (markdown: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  minHeight?: number;
}) {
  const initialHtml = useMemo(() => markdownToHtml(initialMarkdown), [initialMarkdown]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit includes blockquote, code, codeblock, bullet/ordered list,
        // bold, italic, strike, hr, hardbreak, history, and input rules (e.g.
        // typing `# ` creates a heading) by default. That's exactly what we
        // want for a "familiar text editor" feel.
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    autofocus: autoFocus,
    immediatelyRender: false, // avoid SSR hydration mismatches
    editorProps: {
      attributes: {
        class: "stem-note-editor",
        "aria-label": "Note body",
      },
    },
    onUpdate({ editor: ed }) {
      const md = htmlToMarkdown(ed.getHTML());
      onChangeRef.current?.(md);
    },
  });

  // Keep content in sync if initialMarkdown changes externally (e.g. editing
  // a different note inside the same component instance).
  useEffect(() => {
    if (!editor) return;
    const currentMd = htmlToMarkdown(editor.getHTML());
    if (currentMd.trim() === initialMarkdown.trim()) return;
    editor.commands.setContent(initialHtml, { emitUpdate: false });
  }, [editor, initialMarkdown, initialHtml]);

  return (
    <div style={{ ...editorStyles.wrapper, minHeight }}>
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} style={editorStyles.content} />
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor }) {
  const promptLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const items: ToolbarItem[] = [
    { key: "bold", label: "B", title: "Bold (Cmd+B)", active: editor.isActive("bold"), onClick: () => editor.chain().focus().toggleBold().run(), style: { fontWeight: 700 } },
    { key: "italic", label: "I", title: "Italic (Cmd+I)", active: editor.isActive("italic"), onClick: () => editor.chain().focus().toggleItalic().run(), style: { fontStyle: "italic" } },
    { key: "strike", label: "S", title: "Strikethrough", active: editor.isActive("strike"), onClick: () => editor.chain().focus().toggleStrike().run(), style: { textDecoration: "line-through" } },
    { key: "sep1", divider: true },
    { key: "h1", label: "H1", title: "Heading 1", active: editor.isActive("heading", { level: 1 }), onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { key: "h2", label: "H2", title: "Heading 2", active: editor.isActive("heading", { level: 2 }), onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: "h3", label: "H3", title: "Heading 3", active: editor.isActive("heading", { level: 3 }), onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: "sep2", divider: true },
    { key: "bullet", label: "•", title: "Bullet list", active: editor.isActive("bulletList"), onClick: () => editor.chain().focus().toggleBulletList().run() },
    { key: "ordered", label: "1.", title: "Numbered list", active: editor.isActive("orderedList"), onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { key: "quote", label: "\u201D", title: "Quote", active: editor.isActive("blockquote"), onClick: () => editor.chain().focus().toggleBlockquote().run() },
    { key: "sep3", divider: true },
    { key: "code", label: "‹/›", title: "Inline code", active: editor.isActive("code"), onClick: () => editor.chain().focus().toggleCode().run(), style: { fontFamily: "'DM Mono', monospace", fontSize: 11 } },
    { key: "codeblock", label: "{ }", title: "Code block", active: editor.isActive("codeBlock"), onClick: () => editor.chain().focus().toggleCodeBlock().run() },
    { key: "link", label: "🔗", title: "Link (Cmd+K)", active: editor.isActive("link"), onClick: promptLink },
  ];

  return (
    <div style={editorStyles.toolbar}>
      {items.map((item) =>
        item.divider ? (
          <span key={item.key} style={editorStyles.toolbarDivider} />
        ) : (
          <button
            key={item.key}
            type="button"
            title={item.title}
            onMouseDown={(e) => e.preventDefault()} // keep editor focus
            onClick={item.onClick}
            style={{
              ...editorStyles.toolbarBtn,
              ...(item.active ? editorStyles.toolbarBtnActive : null),
              ...(item.style ?? null),
            }}
            aria-pressed={item.active ?? undefined}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

interface ToolbarItem {
  key: string;
  label?: string;
  title?: string;
  active?: boolean;
  divider?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

// ── Styles ────────────────────────────────────────────────────────────────

const editorStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 10,
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    padding: "6px 8px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    flexWrap: "wrap",
  },
  toolbarBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 28,
    padding: "0 7px",
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    transition: "background 0.12s, color 0.12s",
  },
  toolbarBtnActive: {
    background: "var(--leaf)",
    color: "var(--forest)",
  },
  toolbarDivider: {
    display: "inline-block",
    width: 1,
    height: 16,
    background: "var(--paper-dark)",
    margin: "0 4px",
  },
  content: {
    flex: 1,
    padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    lineHeight: 1.65,
    color: "var(--ink)",
    minHeight: 80,
    cursor: "text",
    overflowY: "auto",
    maxHeight: 500,
  },
};
