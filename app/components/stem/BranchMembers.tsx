import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { BranchMember } from "./types";

export function BranchMembersSection({ stemId, members }: { stemId: string; members: BranchMember[] }) {
  const [input, setInput] = useState("");
  const addFetcher = useFetcher<{ success?: boolean; member?: BranchMember; error?: string }>();
  const [open, setOpen] = useState(true);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const username = input.trim().toLowerCase();
    if (!username) return;
    addFetcher.submit({ action: "add", username }, {
      method: "post",
      action: `/api/branches/${stemId}/members`,
    });
    setInput("");
  };

  return (
    <div style={styles.settingsSection}>
      <button style={styles.settingsToggle} onClick={() => setOpen((o) => !o)}>
        Branch Members ({members.length}) {open ? "\u25B2" : "\u25BC"}
      </button>

      {open && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column" as const, gap: 8 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)" }}>
            Branch members can add artifacts directly without approval.
          </p>
          {members.map((m) => (
            <BranchMemberRow key={m.id} member={m} stemId={stemId} />
          ))}
          {members.length === 0 && (
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink-light)" }}>
              No members yet.
            </p>
          )}
          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="username"
              style={{ ...styles.urlInput, fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={!input.trim() || addFetcher.state !== "idle"}
              style={{ ...styles.addBtn, fontSize: 13, padding: "8px 14px" }}
            >
              Add
            </button>
          </form>
          {addFetcher.data?.error && (
            <p style={{ fontSize: 13, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>
              {addFetcher.data.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function BranchMemberRow({ member, stemId }: { member: BranchMember; stemId: string }) {
  const removeFetcher = useFetcher();
  const isRemoving = removeFetcher.state !== "idle";
  const removed = removeFetcher.state === "idle" && removeFetcher.data != null;
  if (removed) return null;

  return (
    <div style={styles.branchMemberRow}>
      <span style={styles.branchMemberName}>@{member.username}</span>
      {member.display_name && (
        <span style={styles.branchMemberDisplay}>{member.display_name}</span>
      )}
      <removeFetcher.Form method="post" action={`/api/branches/${stemId}/members`} style={{ marginLeft: "auto" }}>
        <input type="hidden" name="action" value="remove" />
        <input type="hidden" name="userId" value={member.id} />
        <button type="submit" disabled={isRemoving} style={styles.rejectBtn}>
          Remove
        </button>
      </removeFetcher.Form>
    </div>
  );
}
