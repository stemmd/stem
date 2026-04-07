import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { EmojiPicker } from "~/components/EmojiPicker";
import { styles } from "./stem-styles";
import type { Node, Artifact } from "./types";
import { ArtifactCard } from "./ArtifactCard";
import { AddNodeForm } from "./AddNodeForm";

export function NodeSection({
  node,
  depth,
  childNodesMap,
  nodeToArtifacts,
  artifactsById,
  artifactToNodes,
  approvedNodes,
  stemUserId,
  currentUserId,
  stemUsername,
  isOwner,
  stemId,
}: {
  node: Node;
  depth: number;
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
  artifactsById: Map<string, Artifact>;
  artifactToNodes: Map<string, string[]>;
  approvedNodes: Node[];
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
  isOwner: boolean;
  stemId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editEmoji, setEditEmoji] = useState(node.emoji ?? "");
  const editFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const children = childNodesMap.get(node.id) || [];
  const artifactIds = nodeToArtifacts.get(node.id) || [];
  const nodeArtifacts = artifactIds
    .map((id) => artifactsById.get(id))
    .filter(Boolean) as Artifact[];
  const totalCount = artifactIds.length;

  const isDeleting = deleteFetcher.state !== "idle";
  if (deleteFetcher.state === "idle" && deleteFetcher.data != null) return null;

  return (
    <div style={{ ...styles.nodeSection, paddingLeft: depth * 20 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={styles.nodeHeader}
      >
        <span style={styles.nodeChevron}>{expanded ? "\u25BE" : "\u25B8"}</span>
        {node.emoji && <span style={styles.nodeEmoji}>{node.emoji}</span>}
        <span style={styles.nodeTitle}>{node.title}</span>
        <span style={styles.nodeCount}>
          {totalCount} {totalCount === 1 ? "artifact" : "artifacts"}
        </span>
      </button>

      {expanded && (
        <div style={styles.nodeContent}>
          {node.description && (
            <p style={styles.nodeDesc}>{node.description}</p>
          )}

          {/* Node's artifacts */}
          {nodeArtifacts.map((artifact) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              stemId={stemId}
              stemUserId={stemUserId}
              currentUserId={currentUserId}
              stemUsername={stemUsername}
              nodeNames={
                (artifactToNodes.get(artifact.id)?.length ?? 0) > 1
                  ? artifactToNodes.get(artifact.id)!
                      .filter((nid) => nid !== node.id)
                      .map((nid) => approvedNodes.find((n) => n.id === nid)?.title ?? "")
                      .filter(Boolean)
                  : undefined
              }
            />
          ))}

          {/* Child nodes */}
          {children.map((child) => (
            <NodeSection
              key={child.id}
              node={child}
              depth={depth + 1}
              childNodesMap={childNodesMap}
              nodeToArtifacts={nodeToArtifacts}
              artifactsById={artifactsById}
              artifactToNodes={artifactToNodes}
              approvedNodes={approvedNodes}
              stemUserId={stemUserId}
              currentUserId={currentUserId}
              stemUsername={stemUsername}
              isOwner={isOwner}
              stemId={stemId}
            />
          ))}

          {/* Add sub-node (owner, depth < 3) */}
          {isOwner && depth < 2 && (
            <AddNodeForm stemId={stemId} parentId={node.id} />
          )}

          {/* Owner actions */}
          {isOwner && (
            <div style={styles.nodeActions}>
              <button
                type="button"
                onClick={() => setEditing((e) => !e)}
                style={styles.subtleBtn}
              >
                Edit
              </button>
              <deleteFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_node" />
                <input type="hidden" name="nodeId" value={node.id} />
                <button
                  type="submit"
                  disabled={isDeleting}
                  style={{ ...styles.subtleBtn, color: "var(--taken)" }}
                >
                  Delete
                </button>
              </deleteFetcher.Form>
            </div>
          )}

          {editing && isOwner && (
            <editFetcher.Form method="post" style={styles.editForm}>
              <input type="hidden" name="intent" value="update_node" />
              <input type="hidden" name="nodeId" value={node.id} />
              <input
                type="text"
                name="title"
                defaultValue={node.title}
                placeholder="Node title"
                style={styles.noteInput}
              />
              <EmojiPicker value={editEmoji} onChange={setEditEmoji} name="emoji" />
              <textarea
                name="description"
                defaultValue={node.description ?? ""}
                placeholder="Description (optional)"
                rows={2}
                style={styles.quoteInput}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={styles.settingsSaveBtn}>Save</button>
                <button type="button" onClick={() => setEditing(false)} style={styles.subtleBtn}>Cancel</button>
              </div>
            </editFetcher.Form>
          )}
        </div>
      )}
    </div>
  );
}
