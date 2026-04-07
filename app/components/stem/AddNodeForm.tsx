import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { EmojiPicker } from "~/components/EmojiPicker";
import { styles } from "./stem-styles";

export function AddNodeForm({ stemId, parentId }: { stemId: string; parentId: string | null }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("");
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setTitle("");
      setEmoji("");
      setOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.addNodeBtn}>
        + {parentId ? "Add sub-node" : "Add node"}
      </button>
    );
  }

  return (
    <fetcher.Form method="post" style={styles.addNodeForm}>
      <input type="hidden" name="intent" value="create_node" />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <EmojiPicker value={emoji} onChange={setEmoji} name="emoji" />
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Node title"
          style={{ ...styles.noteInput, flex: 1 }}
        />
        <button
          type="submit"
          disabled={!title.trim() || fetcher.state !== "idle"}
          style={styles.addBtn}
        >
          {fetcher.state !== "idle" ? "Adding\u2026" : "Add"}
        </button>
      </div>
      {fetcher.data?.error && (
        <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>
          {fetcher.data.error}
        </p>
      )}
    </fetcher.Form>
  );
}
