import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { VisibilityPicker, ContributionPicker, CategoryPicker } from "~/components/StemPickers";
import { EmojiPicker } from "~/components/EmojiPicker";
import { styles } from "./stem-styles";
import type { Stem, StemCategory } from "./types";

export function StemSettings({ stem, stemCategories }: { stem: Stem; stemCategories: StemCategory[] }) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const deleteFetcher = useFetcher<{ deleteError?: string }>();
  const [visibility, setVisibility] = useState(stem.visibility ?? (stem.is_public ? "public" : "private"));
  const [mode, setMode] = useState(stem.contribution_mode);
  const [categories, setCategories] = useState(stemCategories.map((c) => c.id));
  const [emoji, setEmoji] = useState(stem.emoji ?? "");
  const [titleValue, setTitleValue] = useState(stem.title);
  const [descValue, setDescValue] = useState(stem.description ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const saved = fetcher.state === "idle" && fetcher.data?.success;

  return (
    <div style={styles.settingsSection}>
      <button style={styles.settingsToggle} onClick={() => setOpen((o) => !o)}>
        Settings {open ? "\u25B2" : "\u25BC"}
      </button>

      {open && (
        <fetcher.Form method="post" style={styles.settingsForm}>
          <input type="hidden" name="intent" value="update_settings" />

          {/* Title */}
          <div>
            <p style={styles.settingsFieldLabel}>Title</p>
            <input
              type="text"
              name="title"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              maxLength={100}
              style={{ ...styles.noteInput, width: "100%", marginTop: 8, boxSizing: "border-box" as const }}
            />
          </div>

          {/* Description */}
          <div>
            <p style={styles.settingsFieldLabel}>Description</p>
            <textarea
              name="description"
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              maxLength={500}
              rows={3}
              style={{ ...styles.quoteInput, fontFamily: "'DM Sans', sans-serif", fontStyle: "normal" as const, marginTop: 8 }}
            />
          </div>

          <div style={styles.settingsDivider} />

          {/* Emoji */}
          <div>
            <p style={styles.settingsFieldLabel}>Emoji</p>
            <EmojiPicker value={emoji} onChange={setEmoji} name="emoji" />
          </div>

          <div style={styles.settingsDivider} />
          <VisibilityPicker name="visibility" value={visibility} onChange={setVisibility} />
          <div style={styles.settingsDivider} />
          <ContributionPicker name="contribution_mode" value={mode} onChange={setMode} />
          <div style={styles.settingsDivider} />
          <CategoryPicker
            name="category"
            selected={categories}
            onChange={setCategories}
            max={3}
            label="Categories (up to 3)"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="submit" style={styles.settingsSaveBtn} disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Saving\u2026" : "Save settings"}
            </button>
            {saved && <span style={{ fontSize: 13, color: "var(--forest)", fontFamily: "'DM Mono', monospace" }}>Saved</span>}
            {fetcher.data?.error && <span style={{ fontSize: 13, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>{fetcher.data.error}</span>}
          </div>
        </fetcher.Form>
      )}

      {/* Delete stem */}
      {open && (
        <div style={{ marginTop: 24, borderTop: "1px solid var(--paper-dark)", paddingTop: 16 }}>
          {!showDelete ? (
            <button type="button" onClick={() => setShowDelete(true)} style={styles.dangerBtn}>
              Delete stem
            </button>
          ) : (
            <deleteFetcher.Form method="post" style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <input type="hidden" name="intent" value="delete_stem" />
              <p style={{ fontSize: 13, color: "var(--taken)", fontFamily: "'DM Sans', sans-serif" }}>
                This permanently deletes this stem and all its artifacts. Type the stem title to confirm.
              </p>
              <input
                type="text"
                name="confirm_title"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={stem.title}
                style={{ ...styles.noteInput, borderColor: "var(--taken)" }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={deleteConfirm !== stem.title || deleteFetcher.state !== "idle"}
                  style={{ ...styles.dangerBtn, opacity: deleteConfirm !== stem.title ? 0.4 : 1 }}
                >
                  {deleteFetcher.state !== "idle" ? "Deleting\u2026" : "Delete everything"}
                </button>
                <button type="button" onClick={() => { setShowDelete(false); setDeleteConfirm(""); }} style={styles.subtleBtn}>
                  Cancel
                </button>
              </div>
              {deleteFetcher.data?.deleteError && (
                <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>{deleteFetcher.data.deleteError}</p>
              )}
            </deleteFetcher.Form>
          )}
        </div>
      )}
    </div>
  );
}
