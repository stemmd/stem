import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { getDomain } from "~/lib/utils";
import { styles } from "./stem-styles";
import type { Artifact } from "./types";

export function PendingSuggestions({ artifacts, stemId }: { artifacts: Artifact[]; stemId: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={styles.pendingSection}>
      <button style={styles.pendingToggle} onClick={() => setOpen((o) => !o)}>
        <span style={styles.pendingCount}>{artifacts.length}</span>
        {artifacts.length === 1 ? " pending suggestion" : " pending suggestions"}
        <span style={{ marginLeft: 6, color: "var(--ink-light)" }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>

      {open && (
        <div style={styles.pendingList}>
          {artifacts.map((artifact) => (
            <PendingArtifactRow key={artifact.id} artifact={artifact} stemId={stemId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PendingArtifactRow({ artifact, stemId }: { artifact: Artifact; stemId: string }) {
  const fetcher = useFetcher();
  const isActing = fetcher.state !== "idle";
  const acted = fetcher.state === "idle" && fetcher.data != null;
  if (acted) return null;

  return (
    <div style={styles.pendingRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {artifact.url ? (
          <a href={artifact.url} target="_blank" rel="noopener noreferrer" style={styles.pendingTitle}>
            {artifact.title || artifact.url}
          </a>
        ) : (
          <p style={styles.pendingTitle}>{artifact.title || "Note"}</p>
        )}
        {artifact.note && <p style={styles.pendingNote}>{artifact.note}</p>}
        {artifact.body && <p style={styles.pendingNote}>{artifact.body.slice(0, 200)}</p>}
        <p style={styles.pendingMeta}>by @{artifact.contributor_username}{artifact.url ? ` \u00B7 ${getDomain(artifact.url)}` : " \u00B7 note"}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="approve_artifact" />
          <input type="hidden" name="artifactId" value={artifact.id} />
          <button type="submit" disabled={isActing} style={styles.approveBtn}>Approve</button>
        </fetcher.Form>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reject_artifact" />
          <input type="hidden" name="artifactId" value={artifact.id} />
          <button type="submit" disabled={isActing} style={styles.rejectBtn}>Reject</button>
        </fetcher.Form>
      </div>
    </div>
  );
}
