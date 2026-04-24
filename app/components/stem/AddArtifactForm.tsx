import { useState, useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import type { OGData } from "~/lib/og.server";
import { isHttpUrl } from "~/lib/utils";
import { styles } from "./stem-styles";
import { ARTIFACT_TYPES } from "./ArtifactCard";
import { NoteEditor } from "./NoteEditor";

type ArtifactTab = "link" | "note" | "image" | "pdf";

export function AddArtifactForm({
  stemId,
  isOwner,
  stemUsername,
  contributionMode,
  canUpload,
  nodeId,
}: {
  stemId: string;
  isOwner: boolean;
  stemUsername: string;
  contributionMode: string;
  canUpload: boolean;
  nodeId?: string | null;
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [open, setOpen] = useState(isOwner);
  const [tab, setTab] = useState<ArtifactTab>("link");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [searchMode, setSearchMode] = useState<"none" | "youtube" | "arxiv" | "wikipedia">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const ogFetcher = useFetcher<OGData>();
  const addFetcher = useFetcher<{ success?: boolean; pending?: boolean; error?: string }>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => { if (debounceRef.current) clearTimeout(debounceRef.current); },
    []
  );

  // Clear form after successful submission (approved or pending)
  useEffect(() => {
    if (addFetcher.state === "idle" && (addFetcher.data?.success || addFetcher.data?.pending)) {
      setUrl("");
      setNote("");
      setQuote("");
      setArtifactType("");
      setNoteTitle("");
      setNoteBody("");
      setUploadFile(null);
      setUploadError("");
      setUploadTitle("");
      setUploadNote("");
      setSearchMode("none");
      setSearchQuery("");
      setSearchResults([]);
      setSearchError("");
    }
  }, [addFetcher.state, addFetcher.data]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // DOI detection: raw DOI or doi.org URL
    const doiFromUrl = val.match(/^https?:\/\/doi\.org\/(.+)$/);
    const doiDirect = val.match(/^(10\.\d{4,9}\/[^\s]+)$/);
    const doi = doiFromUrl?.[1] || doiDirect?.[1];
    if (doi) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/lookup/doi?doi=${encodeURIComponent(doi)}`);
          if (res.ok) {
            const data = await res.json() as { title: string; authors: string[]; journal: string; year: number | null; url: string };
            if (!val.startsWith("http")) setUrl(data.url);
            ogFetcher.load(`/api/og?url=${encodeURIComponent(data.url)}`);
          }
        } catch { /* ignore */ }
      }, 500);
      return;
    }

    // ISBN detection: 10 or 13 digits with optional hyphens
    const stripped = val.replace(/[-\s]/g, "");
    if (/^\d{10}(\d{3})?$/.test(stripped)) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/lookup/isbn?isbn=${stripped}`);
          if (res.ok) {
            const data = await res.json() as { url: string };
            setUrl(data.url);
            ogFetcher.load(`/api/og?url=${encodeURIComponent(data.url)}`);
          }
        } catch { /* ignore */ }
      }, 500);
      return;
    }

    if (!val.startsWith("http")) return;

    debounceRef.current = setTimeout(() => {
      ogFetcher.load(`/api/og?url=${encodeURIComponent(val)}`);
    }, 500);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const endpoint = searchMode === "youtube" ? "/api/search/youtube"
        : searchMode === "arxiv" ? "/api/search/arxiv"
        : "/api/search/wikipedia";
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok && data && typeof data === "object" && "error" in data) {
        setSearchError((data as { error: string }).error);
        setSearchResults([]);
      } else {
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch {
      setSearchResults([]);
      setSearchError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSelect = (result: any) => {
    let selectedUrl = "";
    if (searchMode === "youtube") {
      selectedUrl = `https://www.youtube.com/watch?v=${result.videoId}`;
    } else if (searchMode === "arxiv") {
      selectedUrl = `https://arxiv.org/abs/${result.arxivId}`;
    } else if (searchMode === "wikipedia") {
      selectedUrl = result.pageUrl;
    }
    setUrl(selectedUrl);
    setSearchMode("none");
    setSearchResults([]);
    setSearchQuery("");
    setSearchError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    ogFetcher.load(`/api/og?url=${encodeURIComponent(selectedUrl)}`);
  };

  const og = url ? ogFetcher.data : null;
  const loadingOG = ogFetcher.state === "loading";
  const submitting = addFetcher.state !== "idle";
  // Auto-set type from OG detection when user hasn't picked one
  const detectedType = og && !("error" in og) ? og.source_type : null;
  const effectiveType = artifactType || detectedType || "article";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.contributeBtn}>
        {isOwner ? "Add an artifact" : `Suggest an artifact`}
        <span style={{ color: "var(--ink-light)", marginLeft: 6, fontSize: 11 }}>
          {!isOwner && contributionMode === "open" ? "· owner approves" : `by @${stemUsername}`}
        </span>
      </button>
    );
  }

  const TABS: { key: ArtifactTab; label: string; emoji: string }[] = [
    { key: "link", label: "Link", emoji: "🔗" },
    { key: "note", label: "Note", emoji: "📝" },
    { key: "image", label: "Image", emoji: "🖼️" },
    { key: "pdf", label: "PDF", emoji: "📎" },
  ];

  const tabBar = (
    <div style={styles.tabRow}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTab(t.key)}
          style={{
            ...styles.tabBtn,
            borderBottomColor: tab === t.key ? "var(--forest)" : "transparent",
            color: tab === t.key ? "var(--forest)" : "var(--ink-mid)",
            cursor: "pointer",
          }}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );

  const feedbackMessages = (
    <>
      {addFetcher.data?.pending && (
        <p style={{ fontSize: 13, color: "var(--forest)", fontFamily: "'DM Mono', monospace" }}>
          Submitted — waiting for approval.
        </p>
      )}
      {addFetcher.data?.error && (
        <p style={{ fontSize: 13, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>
          {addFetcher.data.error}
        </p>
      )}
    </>
  );

  if (tab === "note") {
    return (
      <addFetcher.Form method="post" style={styles.addArtifactForm}>
        <input type="hidden" name="intent" value="add_note" />
        {nodeId && <input type="hidden" name="nodeId" value={nodeId} />}
        <input type="hidden" name="body" value={noteBody} />
        {tabBar}
        <input
          type="text"
          name="title"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note title (optional)"
          style={styles.noteInput}
        />
        <NoteEditor
          initialMarkdown=""
          onChange={setNoteBody}
          placeholder="Write your note. Use # for headings, **bold**, *italic*, - for lists, > for quotes."
          minHeight={160}
        />
        <button
          type="submit"
          disabled={!noteBody.trim() || submitting}
          style={{ ...styles.addBtn, opacity: !noteBody.trim() || submitting ? 0.5 : 1 }}
        >
          {submitting ? "Adding…" : "Add note"}
        </button>
        {feedbackMessages}
      </addFetcher.Form>
    );
  }

  if (tab === "image" || tab === "pdf") {
    const isImage = tab === "image";
    const acceptTypes = isImage ? ".jpg,.jpeg,.png,.webp,.gif" : ".pdf";
    const maxSize = isImage ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    const maxLabel = isImage ? "10MB" : "25MB";
    const sourceType = isImage ? "image" : "pdf";

    if (!canUpload) {
      return (
        <div style={styles.addArtifactForm}>
          {tabBar}
          <div style={styles.comingSoon}>
            <p style={styles.comingSoonText}>
              {isImage ? "🖼️" : "📎"}
            </p>
            <p style={styles.comingSoonText}>
              Add a link first to unlock file uploads
            </p>
          </div>
        </div>
      );
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError("");
      const file = e.target.files?.[0];
      if (!file) { setUploadFile(null); return; }
      if (file.size > maxSize) {
        setUploadError(`File is too large (max ${maxLabel})`);
        setUploadFile(null);
        e.target.value = "";
        return;
      }
      setUploadFile(file);
    };

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleUpload = async () => {
      if (!uploadFile) return;
      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        formData.append("file", uploadFile);
        const res = await fetch("https://api.stem.md/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null) as { error?: string } | null;
          throw new Error(errData?.error || "Upload failed");
        }
        const data = await res.json() as { file_key: string; file_mime: string; file_size: number };
        // Auto-submit the Remix form with the file metadata
        const remixForm = new FormData();
        remixForm.set("intent", "add_file_artifact");
        remixForm.set("file_key", data.file_key);
        remixForm.set("file_mime", data.file_mime);
        remixForm.set("file_size", String(data.file_size));
        remixForm.set("source_type", sourceType);
        if (uploadTitle.trim()) remixForm.set("title", uploadTitle.trim());
        if (uploadNote.trim()) remixForm.set("note", uploadNote.trim());
        if (nodeId) remixForm.set("nodeId", nodeId);
        addFetcher.submit(remixForm, { method: "post" });
      } catch (err: unknown) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div style={styles.addArtifactForm}>
        {tabBar}
        <input
          type="file"
          accept={acceptTypes}
          onChange={handleFileSelect}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink)", marginBottom: 8 }}
        />
        {uploadFile && (
          <p style={{ fontSize: 13, color: "var(--ink-mid)", fontFamily: "'DM Mono', monospace", margin: "4px 0 8px" }}>
            {uploadFile.name} ({formatFileSize(uploadFile.size)})
          </p>
        )}
        <input
          type="text"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          placeholder="Title (optional)"
          style={styles.noteInput}
        />
        <input
          type="text"
          value={uploadNote}
          onChange={(e) => setUploadNote(e.target.value)}
          placeholder="Add a note (optional)"
          style={styles.noteInput}
        />
        <button
          type="button"
          disabled={!uploadFile || uploading || submitting}
          onClick={handleUpload}
          style={{
            ...styles.addBtn,
            opacity: !uploadFile || uploading || submitting ? 0.5 : 1,
          }}
        >
          {uploading ? "Uploading..." : submitting ? "Saving..." : `Upload ${isImage ? "image" : "PDF"}`}
        </button>
        {uploadError && (
          <p style={{ fontSize: 13, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>
            {uploadError}
          </p>
        )}
        {feedbackMessages}
      </div>
    );
  }

  return (
    <addFetcher.Form method="post" style={styles.addArtifactForm}>
      <input type="hidden" name="intent" value="add_artifact" />
      {nodeId && <input type="hidden" name="nodeId" value={nodeId} />}
      {tabBar}
      {/* Pass prefetched OG data to avoid re-fetching in the action */}
      {og && !("error" in og) && (
        <>
          <input type="hidden" name="og_title"       value={og.title ?? ""} />
          <input type="hidden" name="og_description" value={og.description ?? ""} />
          <input type="hidden" name="og_image"       value={og.image ?? ""} />
          <input type="hidden" name="og_favicon"     value={og.favicon} />
          <input type="hidden" name="og_domain"      value={og.domain} />
          <input type="hidden" name="og_source_type" value={og.source_type} />
          <input type="hidden" name="og_embed_url"   value={og.embed_url ?? ""} />
        </>
      )}

      <div style={styles.urlRow}>
        <input
          type="url"
          name="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={isOwner ? "Paste a URL you found" : "Paste a URL to contribute"}
          autoComplete="off"
          style={styles.urlInput}
        />
        {loadingOG && <span style={styles.fetchingDot}>…</span>}
      </div>

      <div style={styles.quickSearchRow}>
        <span style={styles.quickSearchLabel}>Quick add:</span>
        <button type="button" onClick={() => { setSearchMode(searchMode === "youtube" ? "none" : "youtube"); setSearchResults([]); setSearchQuery(""); setSearchError(""); }} style={{ ...styles.quickSearchBtn, ...(searchMode === "youtube" ? { borderColor: "var(--forest)", color: "var(--forest)" } : {}) }}>
          {"▶"} YouTube
        </button>
        <button type="button" onClick={() => { setSearchMode(searchMode === "arxiv" ? "none" : "arxiv"); setSearchResults([]); setSearchQuery(""); setSearchError(""); }} style={{ ...styles.quickSearchBtn, ...(searchMode === "arxiv" ? { borderColor: "var(--forest)", color: "var(--forest)" } : {}) }}>
          {"📄"} arXiv
        </button>
        <button type="button" onClick={() => { setSearchMode(searchMode === "wikipedia" ? "none" : "wikipedia"); setSearchResults([]); setSearchQuery(""); setSearchError(""); }} style={{ ...styles.quickSearchBtn, ...(searchMode === "wikipedia" ? { borderColor: "var(--forest)", color: "var(--forest)" } : {}) }}>
          {"🌐"} Wikipedia
        </button>
      </div>

      {searchMode !== "none" && (
        <div style={styles.searchPanel}>
          <div style={styles.searchInputRow}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
              placeholder={searchMode === "youtube" ? "Search YouTube..." : searchMode === "arxiv" ? "Search arXiv..." : "Search Wikipedia..."}
              style={styles.searchInput}
              autoFocus
            />
            <button type="button" onClick={handleSearch} disabled={searching || !searchQuery.trim()} style={{ ...styles.searchBtn, opacity: searching || !searchQuery.trim() ? 0.5 : 1 }}>
              {searching ? "..." : "Search"}
            </button>
            <button type="button" onClick={() => { setSearchMode("none"); setSearchResults([]); setSearchQuery(""); setSearchError(""); }} style={styles.searchCloseBtn}>
              {"✕"}
            </button>
          </div>
          {searchError && (
            <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace", margin: "4px 0" }}>
              {searchError}
            </p>
          )}
          {searchResults.map((result, i) => (
            <button key={i} type="button" onClick={() => handleSearchSelect(result)} style={styles.searchResult}>
              {searchMode === "youtube" && (
                <>
                  {result.thumbnail && <img src={result.thumbnail} alt="" style={styles.searchResultThumb as React.CSSProperties} />}
                  <div>
                    <div style={styles.searchResultTitle}>{result.title}</div>
                    <div style={styles.searchResultMeta}>{result.channelTitle}</div>
                  </div>
                </>
              )}
              {searchMode === "arxiv" && (
                <div>
                  <div style={styles.searchResultTitle}>{result.title}</div>
                  <div style={styles.searchResultMeta}>
                    {(result.authors || []).slice(0, 3).join(", ")}
                    {result.authors?.length > 3 ? ` +${result.authors.length - 3} more` : ""}
                  </div>
                  {result.summary && (
                    <div style={{ ...styles.searchResultMeta, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                      {result.summary.length > 150 ? result.summary.slice(0, 150) + "..." : result.summary}
                    </div>
                  )}
                </div>
              )}
              {searchMode === "wikipedia" && (
                <div>
                  <div style={styles.searchResultTitle}>{result.title}</div>
                  <div style={{ ...styles.searchResultMeta, fontFamily: "'DM Sans', sans-serif" }}>
                    {result.snippet}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {og && !("error" in og) && (
        <div style={styles.previewCard}>
          {og.image && (
            <img
              src={og.image}
              alt=""
              style={styles.previewThumb}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={styles.previewTitle}>{og.title || url}</p>
            <span style={styles.previewDomain}>
              <img src={og.favicon} alt="" style={{ width: 12, height: 12 }} />
              {og.domain}
            </span>
          </div>
        </div>
      )}

      {url && (
        <>
          {/* Type picker */}
          <div style={styles.typePickerRow}>
            {ARTIFACT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setArtifactType(artifactType === t.value ? "" : t.value)}
                style={{
                  ...styles.typePill,
                  background: effectiveType === t.value ? "var(--leaf)" : "transparent",
                  borderColor: effectiveType === t.value ? "var(--forest)" : "var(--paper-dark)",
                  color: effectiveType === t.value ? "var(--forest)" : "var(--ink-light)",
                }}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="artifact_type" value={artifactType || effectiveType} />

          <div style={styles.noteRow}>
            <input
              type="text"
              name="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note (optional)"
              style={styles.noteInput}
            />
            <button
              type="submit"
              disabled={submitting || loadingOG}
              style={{
                ...styles.addBtn,
                opacity: submitting || loadingOG ? 0.5 : 1,
              }}
            >
              {submitting ? "Adding…" : "Add artifact"}
            </button>
          </div>

          <textarea
            name="quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Key quote or highlight (optional, max 300 chars)"
            maxLength={300}
            rows={2}
            style={styles.quoteInput}
          />
        </>
      )}

      {feedbackMessages}
    </addFetcher.Form>
  );
}
