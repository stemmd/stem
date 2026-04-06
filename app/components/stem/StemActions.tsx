import { useState } from "react";
import { Link, useFetcher } from "@remix-run/react";
import { styles } from "./stem-styles";
import type { Stem, Artifact } from "./types";

export function ShareButton({ stem }: { stem: Stem }) {
  const [copied, setCopied] = useState(false);
  const url = `https://stem.md/${stem.username}/${stem.slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: stem.title, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleShare} style={styles.subtleBtn}>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

export function ExportButton({ stem, artifacts }: { stem: Stem; artifacts: Artifact[] }) {
  const handleExport = () => {
    const lines = [
      `# ${stem.title}`,
      "",
      stem.description ? `${stem.description}\n` : "",
      `**Curator:** @${stem.username}`,
      "",
      "---",
      "",
      ...artifacts.map(
        (f) => f.source_type === "note"
          ? `- ${f.title || "Note"}${f.body ? `\n  ${f.body.slice(0, 500)}` : ""}${f.note ? `\n  > ${f.note}` : ""}`
          : `- [${f.title || f.url}](${f.url})${f.note ? `\n  > ${f.note}` : ""}`
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${stem.slug}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <button onClick={handleExport} style={styles.subtleBtn}>
      Export .md
    </button>
  );
}

export function OwnerActions({ stem, artifacts }: { stem: Stem; artifacts: Artifact[] }) {
  return (
    <>
      <ShareButton stem={stem} />
      <ExportButton stem={stem} artifacts={artifacts} />
    </>
  );
}

export function VisitorActions({
  stemId,
  stem,
  isFollowing,
  user,
  artifacts,
}: {
  stemId: string;
  stem: Stem;
  isFollowing: boolean;
  user: { id: string } | null;
  artifacts: Artifact[];
}) {
  const fetcher = useFetcher();
  const optimisticFollowing =
    fetcher.formData
      ? fetcher.formData.get("action") === "follow"
      : isFollowing;

  if (!user) {
    return (
      <>
        <Link to="/signin" style={styles.followPill}>
          Follow this stem
        </Link>
        <ShareButton stem={stem} />
        <ExportButton stem={stem} artifacts={artifacts} />
      </>
    );
  }

  return (
    <>
      <fetcher.Form method="post" action={`/api/stems/${stemId}/follow`}>
        <input
          type="hidden"
          name="action"
          value={optimisticFollowing ? "unfollow" : "follow"}
        />
        <button
          type="submit"
          style={{
            ...styles.followPill,
            background: optimisticFollowing ? "var(--forest)" : "transparent",
            color: optimisticFollowing ? "#fff" : "var(--forest)",
          }}
        >
          {optimisticFollowing ? "Following" : "Follow this stem"}
        </button>
      </fetcher.Form>
      <ShareButton stem={stem} />
      <ExportButton stem={stem} artifacts={artifacts} />
    </>
  );
}
