import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { useCallback, useRef, useState } from "react";
import { requireUser } from "~/lib/auth.server";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { CATEGORIES } from "~/components/StemPickers";
import {
  parseYouTubeHistory,
  hashData,
  type ProposedStem,
  type YouTubeEntry,
} from "~/lib/import-parser";

export const meta: MetaFunction = () => [{ title: "Import — Stem" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  return json({ user });
}

type ImportState = "idle" | "parsing" | "preview" | "importing" | "done";

export default function Import() {
  const { user } = useLoaderData<typeof loader>();
  const [state, setState] = useState<ImportState>("idle");
  const [stems, setStems] = useState<ProposedStem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sourceHash, setSourceHash] = useState("");
  const [totalVideos, setTotalVideos] = useState(0);
  const [importResult, setImportResult] = useState<{ created: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setState("parsing");

    try {
      const text = await file.text();
      const hash = await hashData(text.slice(0, 10000)); // hash first 10KB for dedup
      setSourceHash(hash);

      const entries: YouTubeEntry[] = JSON.parse(text);
      if (!Array.isArray(entries)) {
        setError("This doesn't look like a YouTube watch history file.");
        setState("idle");
        return;
      }

      setTotalVideos(entries.filter((e) => e.titleUrl && e.subtitles?.[0]?.name).length);
      const proposed = parseYouTubeHistory(entries);

      if (proposed.length === 0) {
        setError("No channels with 3+ videos found. Try a larger watch history export.");
        setState("idle");
        return;
      }

      setStems(proposed);
      setState("preview");
    } catch {
      setError("Could not parse this file. Make sure it's the watch-history.json from Google Takeout.");
      setState("idle");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const toggleStem = (id: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const updateStemTitle = (id: string, title: string) => {
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const updateStemCategory = (id: string, categoryId: string) => {
    const emoji = CATEGORIES.find((c) => c.id === categoryId)?.emoji ?? "🌱";
    setStems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, categoryId, emoji } : s))
    );
  };

  const selectedStems = stems.filter((s) => s.selected);
  const totalFinds = selectedStems.reduce((sum, s) => sum + s.finds.length, 0);

  const handleImport = () => {
    if (selectedStems.length === 0) return;
    setState("importing");

    const payload = {
      sourceType: "youtube_history",
      sourceHash,
      stems: selectedStems.map((s) => ({
        title: s.title,
        description: s.description,
        emoji: s.emoji,
        categoryId: s.categoryId,
        visibility: s.visibility,
        finds: s.finds.map((f) => ({
          url: f.url,
          title: f.title,
          source_type: f.source_type,
        })),
      })),
    };

    fetch("https://api.stem.md/import", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data: any) => {
        if (data.success) {
          setState("done");
          setImportResult({ created: data.created ?? selectedStems.length });
        } else {
          setError(data.error || "Import failed.");
          setState("preview");
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
        setState("preview");
      });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <Nav user={user} />

      <main style={styles.main}>
        <h1 style={styles.heading}>Import</h1>
        <p style={styles.sub}>
          Upload your YouTube watch history and we'll create stems from the channels you watch most.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        {state === "idle" && (
          <div
            style={styles.dropzone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <p style={styles.dropIcon}>📂</p>
            <p style={styles.dropText}>Drop your watch-history.json here</p>
            <p style={styles.dropHint}>
              or click to browse. Get it from{" "}
              <a
                href="https://takeout.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--forest)", textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()}
              >
                Google Takeout
              </a>{" "}
              &rarr; YouTube &rarr; history &rarr; JSON format
            </p>
          </div>
        )}

        {state === "parsing" && (
          <div style={styles.loading}>
            <p style={styles.loadingText}>Parsing your watch history...</p>
          </div>
        )}

        {state === "preview" && (
          <>
            <div style={styles.stats}>
              <span style={styles.stat}>{totalVideos} videos found</span>
              <span style={styles.statDivider}>/</span>
              <span style={styles.stat}>{stems.length} channels with 3+ videos</span>
              <span style={styles.statDivider}>/</span>
              <span style={styles.stat}>{selectedStems.length} selected</span>
            </div>

            <div style={styles.stemList}>
              {stems.map((stem) => (
                <div key={stem.id} style={{
                  ...styles.stemCard,
                  opacity: stem.selected ? 1 : 0.5,
                }}>
                  <div style={styles.stemHeader}>
                    <label style={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={stem.selected}
                        onChange={() => toggleStem(stem.id)}
                        style={{ marginRight: 10, flexShrink: 0 }}
                      />
                      <span style={styles.stemEmoji}>{stem.emoji}</span>
                      <input
                        type="text"
                        value={stem.title}
                        onChange={(e) => updateStemTitle(stem.id, e.target.value)}
                        style={styles.stemTitleInput}
                      />
                    </label>
                    <span style={styles.findCount}>{stem.finds.length} finds</span>
                  </div>

                  <p style={styles.stemDesc}>{stem.description}</p>

                  <div style={styles.categoryRow}>
                    <select
                      value={stem.categoryId}
                      onChange={(e) => updateStemCategory(stem.id, e.target.value)}
                      style={styles.categorySelect}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {stem.selected && (
                    <div style={styles.findPreview}>
                      {stem.finds.slice(0, 5).map((f, i) => (
                        <p key={i} style={styles.findTitle}>{f.title}</p>
                      ))}
                      {stem.finds.length > 5 && (
                        <p style={styles.findMore}>+{stem.finds.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.importBar}>
              <p style={styles.importSummary}>
                {selectedStems.length} stems with {totalFinds} finds
              </p>
              <button
                onClick={handleImport}
                disabled={selectedStems.length === 0}
                style={{
                  ...styles.importBtn,
                  opacity: selectedStems.length === 0 ? 0.4 : 1,
                }}
              >
                Import selected
              </button>
            </div>
          </>
        )}

        {state === "importing" && (
          <div style={styles.loading}>
            <p style={styles.loadingText}>Creating your stems...</p>
          </div>
        )}

        {state === "done" && importResult && (
          <div style={styles.doneCard}>
            <p style={styles.doneEmoji}>🌱</p>
            <p style={styles.doneText}>
              Created {importResult.created} stems from your YouTube history.
            </p>
            <a href={`/${user.username}`} style={styles.doneLink}>
              View your profile &rarr;
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    maxWidth: 640,
    width: "100%",
    margin: "0 auto",
    padding: "32px 20px",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 8,
  },
  sub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  error: {
    fontSize: 14,
    color: "var(--taken)",
    padding: "12px 16px",
    background: "rgba(139, 74, 58, 0.08)",
    borderRadius: 8,
    marginBottom: 16,
    fontFamily: "'DM Sans', sans-serif",
  },
  dropzone: {
    border: "2px dashed var(--paper-dark)",
    borderRadius: 12,
    padding: "60px 32px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  dropIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  dropText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 500,
    color: "var(--ink)",
    marginBottom: 8,
  },
  dropHint: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    lineHeight: 1.5,
  },
  loading: {
    textAlign: "center" as const,
    padding: "60px 0",
  },
  loadingText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap" as const,
  },
  stat: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "var(--ink-mid)",
  },
  statDivider: {
    color: "var(--paper-dark)",
    fontSize: 13,
  },
  stemList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    marginBottom: 80,
  },
  stemCard: {
    padding: "16px 20px",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    transition: "opacity 0.15s",
  },
  stemHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },
  stemEmoji: {
    fontSize: 18,
    marginRight: 8,
    flexShrink: 0,
  },
  stemTitleInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: "var(--ink)",
    outline: "none",
    minWidth: 0,
  },
  findCount: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    flexShrink: 0,
  },
  stemDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    marginTop: 4,
    marginLeft: 30,
  },
  categoryRow: {
    marginTop: 8,
    marginLeft: 30,
  },
  categorySelect: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    background: "var(--paper-mid)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 6,
    padding: "4px 8px",
    outline: "none",
    cursor: "pointer",
  },
  findPreview: {
    marginTop: 10,
    marginLeft: 30,
    display: "flex",
    flexDirection: "column" as const,
    gap: 3,
  },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-mid)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  findMore: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 2,
  },
  importBar: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 20px",
    background: "var(--paper)",
    borderTop: "1px solid var(--paper-dark)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 20,
  },
  importSummary: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
  },
  importBtn: {
    padding: "10px 24px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
  doneCard: {
    textAlign: "center" as const,
    padding: "60px 0",
  },
  doneEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  doneText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 18,
    fontWeight: 500,
    color: "var(--ink)",
    marginBottom: 16,
  },
  doneLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--forest)",
    fontWeight: 500,
    textDecoration: "none",
  },
};
