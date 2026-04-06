import { useFetcher } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { Node } from "./types";

export function PendingNodeRow({ node, stemId }: { node: Node; stemId: string }) {
  const fetcher = useFetcher();
  const isActing = fetcher.state !== "idle";
  const acted = fetcher.state === "idle" && fetcher.data != null;
  if (acted) return null;

  return (
    <div style={styles.pendingRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={styles.pendingTitle}>
          {node.emoji && `${node.emoji} `}{node.title}
        </p>
        {node.description && <p style={styles.pendingNote}>{node.description}</p>}
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="approve_node" />
          <input type="hidden" name="nodeId" value={node.id} />
          <button type="submit" disabled={isActing} style={styles.approveBtn}>Approve</button>
        </fetcher.Form>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reject_node" />
          <input type="hidden" name="nodeId" value={node.id} />
          <button type="submit" disabled={isActing} style={styles.rejectBtn}>Reject</button>
        </fetcher.Form>
      </div>
    </div>
  );
}
