import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { getUser, requireUser } from "~/lib/auth.server";
import { fetchOG, type OGData } from "~/lib/og.server";
import { getDomain, isHttpUrl } from "~/lib/utils";
import { mutualCheckSql } from "~/lib/stems.server";
import { CATEGORIES } from "~/components/StemPickers";
import { checkContent, checkBlockedDomain, checkRedirects, checkSafeBrowsing } from "~/lib/moderation";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { nanoid } from "nanoid";
import { createNotification } from "~/lib/notifications.server";

// Extracted stem components
import type { Stem, BranchMember, StemCategory, Node, ArtifactNode, Artifact } from "~/components/stem/types";
import { styles } from "~/components/stem/stem-styles";
import { AddArtifactForm } from "~/components/stem/AddArtifactForm";
import { StemFollowers } from "~/components/stem/StemFollowers";
import { OwnerActions, VisitorActions } from "~/components/stem/StemActions";
import { StemSettings } from "~/components/stem/StemSettings";
import { PendingSuggestions } from "~/components/stem/PendingSuggestions";
import { BranchMembersSection } from "~/components/stem/BranchMembers";
import { OrganicStem } from "~/components/stem/OrganicStem";
import { AddNodeForm } from "~/components/stem/AddNodeForm";
import { StemHeader } from "~/components/stem/StemHeader";
import { PendingNodeRow } from "~/components/stem/PendingNodeRow";
import { ReaderProvider, useReader } from "~/components/stem/ReaderContext";
import { ArtifactReader } from "~/components/stem/ArtifactReader";

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
  if (!data?.stem) return [{ title: "Stem" }];
  const { stem, artifacts } = data;
  const description = stem.description ?? `${stem.title} on Stem`;
  const url = `https://stem.md/${params.username}/${params.slug}`;
  const ogImage = artifacts?.[0]?.image_url ?? stem.avatar_url ?? undefined;
  return [
    { title: `${stem.title} — Stem` },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: stem.title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: "Stem" },
    { property: "og:url", content: url },
    ...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
    { name: "twitter:card", content: ogImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: stem.title },
    { name: "twitter:description", content: description },
    ...(ogImage ? [{ name: "twitter:image", content: ogImage }] : []),
  ];
};

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const { username, slug } = params;
  const user = await getUser(request, context);
  const db = context.cloudflare.env.DB;

  const stem = await db
    .prepare(`
      SELECT s.id, s.title, s.slug, s.description, s.emoji, s.is_public, s.is_branch, s.visibility, s.contribution_mode,
             s.created_at, s.updated_at, s.user_id,
             u.username, u.display_name, u.avatar_url
      FROM stems s JOIN users u ON u.id = s.user_id
      WHERE u.username = ? AND s.slug = ?
    `)
    .bind(username, slug)
    .first<Stem>();

  if (!stem) throw new Response("Not found", { status: 404 });

  const isOwner = user?.id === stem.user_id;
  let canView = isOwner || stem.visibility === "public";
  if (!canView && stem.visibility === "mutuals" && user) {
    const mutualRow = await db.prepare(mutualCheckSql())
      .bind(user.id, stem.user_id, stem.user_id, user.id)
      .first<{ c: number }>();
    canView = (mutualRow?.c ?? 0) >= 2;
  }
  if (!canView) throw new Response("Not found", { status: 404 });

  const artifactsSql = `
    SELECT f.id, f.url, f.title, f.description, f.image_url, f.favicon_url,
           f.note, f.quote, f.source_type, f.embed_url, f.body,
           f.file_key, f.file_mime, f.file_size,
           f.stem_position, f.stem_side,
           f.created_at, f.added_by,
           u.username as contributor_username
    FROM artifacts f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'approved'
    ORDER BY f.stem_position ASC NULLS LAST, f.created_at DESC
  `;

  const pendingSql = `
    SELECT f.id, f.url, f.title, f.description, f.image_url, f.favicon_url,
           f.note, f.quote, f.source_type, f.embed_url, f.body,
           f.file_key, f.file_mime, f.file_size,
           f.created_at, f.added_by,
           u.username as contributor_username
    FROM artifacts f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'pending'
    ORDER BY f.created_at ASC
  `;

  const [artifactsResult, followCountRow, followRow, pendingResult, mutualRow, branchMemberRow, branchMembersResult, stemCatsResult, nodesResult, artifactNodesResult, approvedLinkRow, relatedStemsResult] = await Promise.all([
    db.prepare(artifactsSql).bind(stem.id).all<Artifact>(),
    db.prepare("SELECT COUNT(*) as c FROM stem_follows WHERE stem_id = ?").bind(stem.id).first<{ c: number }>(),
    user ? db.prepare("SELECT id FROM stem_follows WHERE follower_id = ? AND stem_id = ?").bind(user.id, stem.id).first() : Promise.resolve(null),
    isOwner
      ? db.prepare(pendingSql).bind(stem.id).all<Artifact>()
      : (user && !isOwner)
        ? db.prepare(`${pendingSql.replace("WHERE f.stem_id = ? AND f.status = 'pending'", "WHERE f.stem_id = ? AND f.status = 'pending' AND f.added_by = ?")}`).bind(stem.id, user!.id).all<Artifact>()
        : Promise.resolve({ results: [] as Artifact[] }),
    (user && !isOwner && stem.contribution_mode === "mutuals")
      ? db.prepare("SELECT COUNT(*) as c FROM user_follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)").bind(user.id, stem.user_id, stem.user_id, user.id).first<{ c: number }>()
      : Promise.resolve(null),
    (user && !isOwner && stem.is_branch)
      ? db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, user.id).first()
      : Promise.resolve(null),
    (isOwner && stem.is_branch)
      ? db.prepare(`
          SELECT u.id, u.username, u.display_name, u.avatar_url
          FROM branch_members gm JOIN users u ON u.id = gm.user_id
          WHERE gm.branch_id = ? ORDER BY gm.created_at ASC
        `).bind(stem.id).all<BranchMember>()
      : Promise.resolve({ results: [] as BranchMember[] }),
    db.prepare(`
      SELECT c.id, c.name, c.emoji FROM stem_categories sc
      JOIN categories c ON c.id = sc.category_id
      WHERE sc.stem_id = ? ORDER BY c.name ASC
    `).bind(stem.id).all<StemCategory>(),
    db.prepare(`
      SELECT id, parent_id, title, description, emoji, position, stem_side, status, created_by
      FROM nodes WHERE stem_id = ? ORDER BY position ASC
    `).bind(stem.id).all<Node>(),
    db.prepare(`
      SELECT an.artifact_id, an.node_id, an.position
      FROM artifact_nodes an
      JOIN nodes n ON n.id = an.node_id
      WHERE n.stem_id = ?
      ORDER BY an.position ASC
    `).bind(stem.id).all<ArtifactNode>(),
    user
      ? db.prepare("SELECT COUNT(*) as c FROM artifacts WHERE added_by = ? AND status = 'approved' AND url IS NOT NULL").bind(user.id).first<{ c: number }>()
      : Promise.resolve(null),
    db.prepare(`
      SELECT DISTINCT s.id, s.title, s.slug, s.emoji,
             u.username, u.display_name,
             (SELECT COUNT(*) FROM artifacts f WHERE f.stem_id = s.id AND f.status = 'approved') as artifact_count
      FROM stems s
      JOIN users u ON u.id = s.user_id
      JOIN stem_categories sc ON sc.stem_id = s.id
      WHERE sc.category_id IN (SELECT category_id FROM stem_categories WHERE stem_id = ?)
        AND s.id != ?
        AND s.visibility = 'public'
      ORDER BY artifact_count DESC
      LIMIT 6
    `).bind(stem.id, stem.id).all<{
      id: string; title: string; slug: string; emoji: string | null;
      username: string; display_name: string | null; artifact_count: number;
    }>(),
  ]);

  const userHasApprovedArtifact = (approvedLinkRow?.c ?? 0) > 0;
  const isBranchMember = !!branchMemberRow;
  const isMutual = (mutualRow?.c ?? 0) >= 2;
  const canContribute =
    isOwner ||
    isBranchMember ||
    (!!user && stem.contribution_mode === "open") ||
    (!!user && stem.contribution_mode === "mutuals" && isMutual);

  return json({
    stem,
    artifacts: artifactsResult.results,
    pendingArtifacts: isOwner ? (pendingResult.results ?? []) : [],
    myPendingArtifacts: (!isOwner && user) ? (pendingResult.results ?? []) : [],
    user,
    isOwner,
    isBranchMember,
    isFollowing: !!followRow,
    followCount: followCountRow?.c ?? 0,
    canContribute,
    branchMembers: branchMembersResult.results,
    stemCategories: stemCatsResult.results,
    nodes: nodesResult.results,
    artifactNodes: artifactNodesResult.results,
    userHasApprovedArtifact,
    relatedStems: relatedStemsResult.results,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function checkContributionPermission(
  db: D1Database, stem: { id: string; user_id: string; is_branch: number; contribution_mode: string }, userId: string
): Promise<{ isOwner: boolean; isBranchMember: boolean; error?: string }> {
  const isOwner = userId === stem.user_id;
  // Check if stem owner has blocked this user
  if (!isOwner) {
    const blocked = await db
      .prepare("SELECT 1 FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?")
      .bind(stem.user_id, userId)
      .first();
    if (blocked) return { isOwner, isBranchMember: false, error: "You cannot contribute to this stem." };
  }
  const isBranchMember = (!isOwner && stem.is_branch)
    ? !!(await db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, userId).first())
    : false;
  if (!isOwner && !isBranchMember) {
    if (stem.contribution_mode === "closed") return { isOwner, isBranchMember, error: "This stem is not accepting suggestions." };
    if (stem.contribution_mode === "mutuals") {
      const mutualRow = await db.prepare(
        "SELECT COUNT(*) as c FROM user_follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)"
      ).bind(userId, stem.user_id, stem.user_id, userId).first<{ c: number }>();
      if ((mutualRow?.c ?? 0) < 2) return { isOwner, isBranchMember, error: "Only mutuals can contribute to this stem." };
    }
  }
  return { isOwner, isBranchMember };
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { username, slug } = params;
  const db = context.cloudflare.env.DB;

  const stem = await db
    .prepare(`
      SELECT s.id, s.user_id, s.is_public, s.is_branch, s.visibility, s.contribution_mode FROM stems s JOIN users u ON u.id = s.user_id
      WHERE u.username = ? AND s.slug = ?
    `)
    .bind(username, slug)
    .first<{ id: string; user_id: string; is_public: number; is_branch: number; visibility: string; contribution_mode: string }>();

  if (!stem) throw new Response("Not found", { status: 404 });

  const user = await requireUser(request, context);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "update_settings") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const newTitle = (form.get("title") as string | null)?.trim();
    const newDescription = (form.get("description") as string | null)?.trim() || null;
    if (newTitle && newTitle.length > 100) {
      return json({ error: "Title is too long (max 100 characters)." }, { status: 400 });
    }
    if (newDescription && newDescription.length > 500) {
      return json({ error: "Description is too long (max 500 characters)." }, { status: 400 });
    }
    const visibility = form.get("visibility") as string;
    const mode = form.get("contribution_mode") as string;
    if (!["public", "mutuals", "private"].includes(visibility)) {
      return json({ error: "Invalid visibility." }, { status: 400 });
    }
    if (!["open", "mutuals", "closed"].includes(mode)) {
      return json({ error: "Invalid contribution mode." }, { status: 400 });
    }
    if (newTitle && checkContent(newTitle, newDescription)) {
      return json({ error: "This content can't be posted. Please review our community guidelines." }, { status: 400 });
    }
    const rawEmoji = (form.get("emoji") as string | null)?.trim() ?? "";
    const emoji = rawEmoji ? ([...rawEmoji][0] ?? null) : null;
    const isPublic = visibility === "public" ? 1 : 0;
    const titleClause = newTitle ? "title = ?, " : "";
    const descClause = "description = ?, ";
    // Update categories (delete + re-insert) — needed before resolving fallback emoji
    const catCount = Math.min(parseInt((form.get("category_count") as string) || "0", 10), 3);
    const newCats: string[] = [];
    for (let i = 0; i < catCount; i++) {
      const id = (form.get(`category_${i}`) as string | null)?.trim();
      if (id) newCats.push(id);
    }

    const resolvedEmoji = emoji || (CATEGORIES.find(c => c.id === newCats[0])?.emoji ?? null);
    await db.prepare(`UPDATE stems SET ${titleClause}${descClause}visibility = ?, is_public = ?, contribution_mode = ?, emoji = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(...(newTitle ? [newTitle, newDescription, visibility, isPublic, mode, resolvedEmoji, stem.id] : [newDescription, visibility, isPublic, mode, resolvedEmoji, stem.id]))
      .run();
    await db.prepare("DELETE FROM stem_categories WHERE stem_id = ?").bind(stem.id).run();
    for (const catId of newCats) {
      await db.prepare("INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES (?, ?)")
        .bind(stem.id, catId).run();
    }

    return json({ success: true });
  }

  if (intent === "approve_artifact") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const artifactId = form.get("artifactId") as string;
    await db.prepare("UPDATE artifacts SET status = 'approved' WHERE id = ? AND stem_id = ?")
      .bind(artifactId, stem.id).run();
    // Notify the contributor that their artifact was approved
    const artifact = await db
      .prepare("SELECT added_by FROM artifacts WHERE id = ?")
      .bind(artifactId)
      .first<{ added_by: string }>();
    if (artifact) {
      await createNotification({
        db, userId: artifact.added_by, type: "artifact_approved", actorId: user.id, stemId: stem.id, artifactId,
      });
    }
    return json({ success: true });
  }

  if (intent === "reject_artifact") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const artifactId = form.get("artifactId") as string;
    await db.prepare("DELETE FROM artifacts WHERE id = ? AND stem_id = ?")
      .bind(artifactId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "report_artifact") {
    const artifactId = form.get("artifactId") as string;
    if (!artifactId) return json({ error: "Missing artifact." }, { status: 400 });
    await db.prepare("INSERT OR IGNORE INTO reports (artifact_id, reported_by) VALUES (?, ?)")
      .bind(artifactId, user.id).run();
    return json({ reported: true });
  }

  if (intent === "add_artifact") {
    if (stem.visibility === "private") throw new Response("Forbidden", { status: 403 });
    const { isOwner, isBranchMember, error: permError } = await checkContributionPermission(db, stem, user.id);
    if (permError) return json({ error: permError }, { status: 403 });

    const url = (form.get("url") as string | null)?.trim();
    if (!url) return json({ error: "URL is required." }, { status: 400 });
    if (!isHttpUrl(url)) return json({ error: "URL must start with http:// or https://." }, { status: 400 });

    const domainCheck = await checkBlockedDomain(db, url);
    if (domainCheck.blocked) return json({ error: domainCheck.reason || "This URL is not allowed on Stem." }, { status: 400 });

    const redirectCheck = await checkRedirects(url);
    if (redirectCheck.suspicious) return json({ error: redirectCheck.reason }, { status: 400 });

    const safeBrowsingKey = context.cloudflare.env.GOOGLE_SAFE_BROWSING_KEY;
    const safeCheck = await checkSafeBrowsing(url, safeBrowsingKey);
    if (safeCheck.unsafe) return json({ error: safeCheck.reason || "This URL has been flagged as unsafe." }, { status: 400 });

    const note = (form.get("note") as string | null)?.trim() || null;
    if (note && note.length > 500) return json({ error: "Note is too long (max 500 characters)." }, { status: 400 });

    const quote = (form.get("quote") as string | null)?.trim() || null;
    if (quote && quote.length > 300) return json({ error: "Quote is too long (max 300 characters)." }, { status: 400 });

    if (checkContent(note, quote)) {
      return json({ error: "This content can't be posted. Please review our community guidelines." }, { status: 400 });
    }
    const artifactType = (form.get("artifact_type") as string | null)?.trim() || null;

    // Use client-prefetched OG fields if available, otherwise fetch server-side
    const ogTitle       = (form.get("og_title")       as string | null) || null;
    const ogDescription = (form.get("og_description") as string | null) || null;
    const ogImageRaw    = (form.get("og_image")       as string | null) || null;
    const ogFaviconRaw  = (form.get("og_favicon")     as string | null) || null;
    const ogImage       = ogImageRaw   && isHttpUrl(ogImageRaw)   ? ogImageRaw   : null;
    const ogFavicon     = ogFaviconRaw && isHttpUrl(ogFaviconRaw) ? ogFaviconRaw : null;
    const ogDomain      = (form.get("og_domain")      as string | null) || null;
    const ogSourceType  = (form.get("og_source_type") as string | null) || null;
    const ogEmbedUrlRaw = (form.get("og_embed_url")   as string | null) || null;
    const ogEmbedUrl    = ogEmbedUrlRaw && isHttpUrl(ogEmbedUrlRaw) ? ogEmbedUrlRaw : null;

    let og: OGData;
    if (ogTitle || ogDomain) {
      og = {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        favicon: ogFavicon ?? `https://www.google.com/s2/favicons?domain=${ogDomain}&sz=32`,
        domain: ogDomain ?? getDomain(url),
        source_type: (artifactType as OGData["source_type"]) ?? (ogSourceType as OGData["source_type"]) ?? "article",
        embed_url: ogEmbedUrl,
      };
    } else {
      og = await fetchOG(url);
      // Allow user-supplied type to override the auto-detected one
      if (artifactType) og = { ...og, source_type: artifactType as OGData["source_type"] };
    }

    const artifactStatus = (isOwner || isBranchMember) ? "approved" : "pending";
    const artifactId = `fnd_${nanoid(10)}`;
    await db
      .prepare(`
        INSERT INTO artifacts (id, stem_id, added_by, url, title, description, image_url, favicon_url, note, quote, source_type, embed_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(artifactId, stem.id, user.id, url, og.title, og.description, og.image, og.favicon, note, quote, og.source_type, og.embed_url, artifactStatus)
      .run();

    const nodeId = (form.get("nodeId") as string | null)?.trim() || null;
    await Promise.all([
      artifactStatus === "approved"
        ? db.prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?").bind(stem.id).run()
        : Promise.resolve(),
      createNotification({
        db, userId: stem.user_id, type: "new_artifact", actorId: user.id, stemId: stem.id, artifactId,
      }),
      nodeId
        ? db.prepare("INSERT OR IGNORE INTO artifact_nodes (id, artifact_id, node_id, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1000 FROM artifact_nodes WHERE node_id = ?))")
            .bind(`an_${nanoid(10)}`, artifactId, nodeId, nodeId).run()
        : Promise.resolve(),
    ]);

    return json({ success: true, artifactId, pending: artifactStatus === "pending" });
  }

  if (intent === "add_note") {
    if (stem.visibility === "private") throw new Response("Forbidden", { status: 403 });
    const { isOwner, isBranchMember, error: permError } = await checkContributionPermission(db, stem, user.id);
    if (permError) return json({ error: permError }, { status: 403 });

    const title = (form.get("title") as string | null)?.trim() || null;
    const body = (form.get("body") as string | null)?.trim();
    if (!body) return json({ error: "Note body is required." }, { status: 400 });
    if (body.length > 5000) return json({ error: "Note is too long (max 5000 characters)." }, { status: 400 });
    if (checkContent(title, body)) {
      return json({ error: "This content can't be posted. Please review our community guidelines." }, { status: 400 });
    }

    const artifactStatus = (isOwner || isBranchMember) ? "approved" : "pending";
    const artifactId = `fnd_${nanoid(10)}`;
    await db.prepare(
      "INSERT INTO artifacts (id, stem_id, added_by, title, body, source_type, status) VALUES (?, ?, ?, ?, ?, 'note', ?)"
    ).bind(artifactId, stem.id, user.id, title, body, artifactStatus).run();

    const nodeId = (form.get("nodeId") as string | null)?.trim() || null;
    await Promise.all([
      artifactStatus === "approved"
        ? db.prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?").bind(stem.id).run()
        : Promise.resolve(),
      createNotification({
        db, userId: stem.user_id, type: "new_artifact", actorId: user.id, stemId: stem.id, artifactId,
      }),
      nodeId
        ? db.prepare("INSERT OR IGNORE INTO artifact_nodes (id, artifact_id, node_id, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1000 FROM artifact_nodes WHERE node_id = ?))")
            .bind(`an_${nanoid(10)}`, artifactId, nodeId, nodeId).run()
        : Promise.resolve(),
    ]);

    return json({ success: true, artifactId, pending: artifactStatus === "pending" });
  }

  if (intent === "add_file_artifact") {
    if (stem.visibility === "private") throw new Response("Forbidden", { status: 403 });
    const { isOwner, isBranchMember, error: permError } = await checkContributionPermission(db, stem, user.id);
    if (permError) return json({ error: permError }, { status: 403 });

    const fileKey = form.get("file_key") as string;
    const fileMime = form.get("file_mime") as string;
    const fileSize = parseInt(form.get("file_size") as string, 10);
    const title = (form.get("title") as string | null)?.trim() || null;
    const note = (form.get("note") as string | null)?.trim() || null;
    const sourceType = form.get("source_type") as string; // "image" or "pdf"

    if (!fileKey || !fileMime) return json({ error: "File upload failed." }, { status: 400 });

    const artifactStatus = (isOwner || isBranchMember) ? "approved" : "pending";
    const artifactId = `fnd_${nanoid(10)}`;

    await db.prepare(
      "INSERT INTO artifacts (id, stem_id, added_by, title, note, source_type, file_key, file_mime, file_size, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(artifactId, stem.id, user.id, title, note, sourceType, fileKey, fileMime, fileSize, artifactStatus).run();

    const nodeId = (form.get("nodeId") as string | null)?.trim() || null;
    await Promise.all([
      artifactStatus === "approved"
        ? db.prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?").bind(stem.id).run()
        : Promise.resolve(),
      createNotification({
        db, userId: stem.user_id, type: "new_artifact", actorId: user.id, stemId: stem.id, artifactId,
      }),
      nodeId
        ? db.prepare("INSERT OR IGNORE INTO artifact_nodes (id, artifact_id, node_id, position) VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1000 FROM artifact_nodes WHERE node_id = ?))")
            .bind(`an_${nanoid(10)}`, artifactId, nodeId, nodeId).run()
        : Promise.resolve(),
    ]);

    return json({ success: true, artifactId, pending: artifactStatus === "pending" });
  }

  if (intent === "delete_artifact") {
    const artifactId = form.get("artifactId") as string;
    const artifact = await db
      .prepare("SELECT id, stem_id, added_by FROM artifacts WHERE id = ?")
      .bind(artifactId)
      .first<{ id: string; stem_id: string; added_by: string }>();

    if (!artifact || artifact.stem_id !== stem.id) {
      return json({ error: "Not found." }, { status: 404 });
    }
    if (artifact.added_by !== user.id && user.id !== stem.user_id) {
      return json({ error: "Forbidden." }, { status: 403 });
    }

    await db.prepare("DELETE FROM artifacts WHERE id = ?").bind(artifactId).run();
    return json({ success: true });
  }

  if (intent === "edit_artifact") {
    const artifactId = form.get("artifactId") as string;
    const artifact = await db
      .prepare("SELECT id, stem_id, added_by FROM artifacts WHERE id = ?")
      .bind(artifactId)
      .first<{ id: string; stem_id: string; added_by: string }>();

    if (!artifact || artifact.stem_id !== stem.id) {
      return json({ error: "Not found." }, { status: 404 });
    }
    if (artifact.added_by !== user.id && user.id !== stem.user_id) {
      return json({ error: "Forbidden." }, { status: 403 });
    }

    const newNote = (form.get("note") as string | null)?.trim() || null;
    const newQuote = (form.get("quote") as string | null)?.trim() || null;
    const newType = (form.get("artifact_type") as string | null)?.trim() || null;
    const VALID_TYPES = ["article","book","paper","podcast","video","tool","person","place","concept","wikipedia","youtube","arxiv","note","image","pdf","audio"];
    const finalType = newType && VALID_TYPES.includes(newType) ? newType : null;

    await db
      .prepare("UPDATE artifacts SET note=?, quote=?" + (finalType ? ", source_type=?" : "") + " WHERE id=?")
      .bind(...(finalType ? [newNote, newQuote, finalType, artifactId] : [newNote, newQuote, artifactId]))
      .run();

    return json({ success: true });
  }

  // ── Node intents ─────���──────────────────────────────────────────────────────

  if (intent === "create_node") {
    const isOwner = user.id === stem.user_id;
    const isBranchMember = (!isOwner && stem.is_branch)
      ? !!(await db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, user.id).first())
      : false;
    if (!isOwner && !isBranchMember) throw new Response("Forbidden", { status: 403 });

    const title = (form.get("title") as string | null)?.trim();
    if (!title) return json({ error: "Title is required." }, { status: 400 });

    const emoji = (form.get("emoji") as string | null)?.trim() || null;
    const parentId = (form.get("parent_id") as string | null)?.trim() || null;

    // Enforce 10-level nesting cap
    if (parentId) {
      let depth = 0;
      let currentId: string | null = parentId;
      while (currentId && depth < 12) {
        const parent = await db.prepare("SELECT parent_id, stem_id FROM nodes WHERE id = ?")
          .bind(currentId).first<{ parent_id: string | null; stem_id: string }>();
        if (!parent || parent.stem_id !== stem.id) break;
        currentId = parent.parent_id;
        depth++;
      }
      if (depth >= 10) {
        return json({ error: "Maximum nesting depth (10 levels) reached." }, { status: 400 });
      }
    }

    // Get next position
    const lastNode = await db.prepare(
      "SELECT MAX(position) as maxPos FROM nodes WHERE stem_id = ? AND parent_id IS ?"
    ).bind(stem.id, parentId).first<{ maxPos: number | null }>();
    const position = (lastNode?.maxPos ?? -1000) + 1000;

    const nodeId = `nod_${nanoid(10)}`;
    await db.prepare(
      "INSERT INTO nodes (id, stem_id, parent_id, title, emoji, position, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)"
    ).bind(nodeId, stem.id, parentId, title, emoji, position, user.id).run();

    return json({ success: true, nodeId });
  }

  if (intent === "suggest_node") {
    if (stem.visibility === "private") throw new Response("Forbidden", { status: 403 });
    if (user.id === stem.user_id) return json({ error: "Owners should use create_node." }, { status: 400 });
    const { error: permError } = await checkContributionPermission(db, stem, user.id);
    if (permError) return json({ error: permError }, { status: 403 });

    const title = (form.get("title") as string | null)?.trim();
    if (!title) return json({ error: "Title is required." }, { status: 400 });
    const emoji = (form.get("emoji") as string | null)?.trim() || null;
    const parentId = (form.get("parent_id") as string | null)?.trim() || null;

    const lastNode = await db.prepare(
      "SELECT MAX(position) as maxPos FROM nodes WHERE stem_id = ? AND parent_id IS ?"
    ).bind(stem.id, parentId).first<{ maxPos: number | null }>();
    const position = (lastNode?.maxPos ?? -1000) + 1000;

    const nodeId = `nod_${nanoid(10)}`;
    await db.prepare(
      "INSERT INTO nodes (id, stem_id, parent_id, title, emoji, position, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(nodeId, stem.id, parentId, title, emoji, position, user.id).run();

    return json({ success: true, nodeId, pending: true });
  }

  if (intent === "approve_node") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const nodeId = form.get("nodeId") as string;
    await db.prepare("UPDATE nodes SET status = 'approved' WHERE id = ? AND stem_id = ?")
      .bind(nodeId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "reject_node") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const nodeId = form.get("nodeId") as string;
    await db.prepare("DELETE FROM nodes WHERE id = ? AND stem_id = ?")
      .bind(nodeId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "update_node") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const nodeId = form.get("nodeId") as string;
    const title = (form.get("title") as string | null)?.trim();
    const emoji = (form.get("emoji") as string | null)?.trim() ?? null;
    const description = (form.get("description") as string | null)?.trim() ?? null;

    if (!title) return json({ error: "Title is required." }, { status: 400 });

    await db.prepare("UPDATE nodes SET title = ?, emoji = ?, description = ? WHERE id = ? AND stem_id = ?")
      .bind(title, emoji, description, nodeId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "delete_node") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const nodeId = form.get("nodeId") as string;

    // Delete all artifact_nodes for this node and its descendants (max 3 levels)
    await db.prepare(`
      DELETE FROM artifact_nodes WHERE node_id IN (
        SELECT id FROM nodes WHERE id = ? OR parent_id = ?
        OR parent_id IN (SELECT id FROM nodes WHERE parent_id = ?)
      )
    `).bind(nodeId, nodeId, nodeId).run();

    // Delete descendant nodes then the node itself
    await db.prepare(`
      DELETE FROM nodes WHERE parent_id IN (SELECT id FROM nodes WHERE parent_id = ?)
    `).bind(nodeId).run();
    await db.prepare("DELETE FROM nodes WHERE parent_id = ?").bind(nodeId).run();
    await db.prepare("DELETE FROM nodes WHERE id = ? AND stem_id = ?").bind(nodeId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "reorder_nodes") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    let nodeIds: string[];
    try { nodeIds = JSON.parse(form.get("nodeIds") as string); }
    catch { return json({ error: "Invalid node order data." }, { status: 400 }); }
    await db.batch(
      nodeIds.map((id, i) =>
        db.prepare("UPDATE nodes SET position = ? WHERE id = ? AND stem_id = ?")
          .bind(i * 1000, id, stem.id)
      )
    );
    return json({ success: true });
  }

  if (intent === "reorder_stem_items") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    let items: { id: string; type: "node" | "artifact" }[];
    try { items = JSON.parse(form.get("items") as string); }
    catch { return json({ error: "Invalid order data." }, { status: 400 }); }
    const stmts = items.map((item, i) => {
      if (item.type === "node") {
        return db.prepare("UPDATE nodes SET position = ? WHERE id = ? AND stem_id = ?")
          .bind(i * 1000, item.id, stem.id);
      }
      return db.prepare("UPDATE artifacts SET stem_position = ? WHERE id = ? AND stem_id = ?")
        .bind(i * 1000, item.id, stem.id);
    });
    if (stmts.length > 0) await db.batch(stmts);
    return json({ success: true });
  }

  if (intent === "assign_artifact_node") {
    const isOwner = user.id === stem.user_id;
    const isBranchMember = (!isOwner && stem.is_branch)
      ? !!(await db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, user.id).first())
      : false;
    if (!isOwner && !isBranchMember) throw new Response("Forbidden", { status: 403 });

    const artifactId = form.get("artifactId") as string;
    const nodeId = form.get("nodeId") as string;

    // Move (not tag): remove all existing node assignments, then assign to the new node
    await db.prepare("DELETE FROM artifact_nodes WHERE artifact_id = ?").bind(artifactId).run();

    const lastPos = await db.prepare(
      "SELECT MAX(position) as maxPos FROM artifact_nodes WHERE node_id = ?"
    ).bind(nodeId).first<{ maxPos: number | null }>();
    const position = (lastPos?.maxPos ?? -1000) + 1000;

    const id = `an_${nanoid(10)}`;
    await db.prepare(
      "INSERT INTO artifact_nodes (id, artifact_id, node_id, position) VALUES (?, ?, ?, ?)"
    ).bind(id, artifactId, nodeId, position).run();
    return json({ success: true });
  }

  if (intent === "remove_artifact_node") {
    const isOwner = user.id === stem.user_id;
    const isBranchMember = (!isOwner && stem.is_branch)
      ? !!(await db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, user.id).first())
      : false;
    if (!isOwner && !isBranchMember) throw new Response("Forbidden", { status: 403 });

    const artifactId = form.get("artifactId") as string;
    const nodeId = form.get("nodeId") as string;
    await db.prepare("DELETE FROM artifact_nodes WHERE artifact_id = ? AND node_id = ?")
      .bind(artifactId, nodeId).run();
    return json({ success: true });
  }

  if (intent === "delete_stem") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const confirmed = (form.get("confirm_title") as string | null)?.trim();
    const stemTitle = await db.prepare("SELECT title FROM stems WHERE id = ?").bind(stem.id).first<{ title: string }>();
    if (!stemTitle || confirmed !== stemTitle.title) {
      return json({ deleteError: "Title doesn't match." });
    }
    // artifact_nodes must be deleted before nodes (FK dependency)
    await db.prepare("DELETE FROM artifact_nodes WHERE node_id IN (SELECT id FROM nodes WHERE stem_id = ?)").bind(stem.id).run();
    await Promise.all([
      db.prepare("DELETE FROM nodes WHERE stem_id = ?").bind(stem.id).run(),
      db.prepare("DELETE FROM artifacts WHERE stem_id = ?").bind(stem.id).run(),
      db.prepare("DELETE FROM branch_members WHERE branch_id = ?").bind(stem.id).run(),
      db.prepare("DELETE FROM stem_categories WHERE stem_id = ?").bind(stem.id).run(),
      db.prepare("DELETE FROM stem_follows WHERE stem_id = ?").bind(stem.id).run(),
    ]);
    await db.prepare("DELETE FROM stems WHERE id = ?").bind(stem.id).run();
    throw redirect(`/${username}`);
  }

  return json({ error: "Unknown intent." }, { status: 400 });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StemPageRoute() {
  return (
    <ReaderProvider>
      <StemPage />
    </ReaderProvider>
  );
}

function StemPage() {
  const { stem, artifacts, pendingArtifacts, myPendingArtifacts, user, isOwner, isBranchMember, isFollowing, followCount, canContribute, branchMembers, stemCategories, nodes, artifactNodes, userHasApprovedArtifact, relatedStems } =
    useLoaderData<typeof loader>();

  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [showPendingNodes, setShowPendingNodes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const reader = useReader();
  const readerOpen = !!reader?.current;

  // Build node tree and artifact mapping (memoized to avoid recomputation on state changes)
  const { approvedNodes, pendingNodes, rootNodes, childNodesMap, artifactToNodes, nodeToArtifacts, artifactsById, rootArtifacts, hasNodes } = useMemo(() => {
    const approved = nodes.filter((n) => n.status === "approved");
    const pending = nodes.filter((n) => n.status === "pending");
    const roots = approved.filter((n) => !n.parent_id);
    const childMap = new Map<string, typeof approved>();
    for (const n of approved) {
      if (n.parent_id) {
        const siblings = childMap.get(n.parent_id) || [];
        siblings.push(n);
        childMap.set(n.parent_id, siblings);
      }
    }
    const a2n = new Map<string, string[]>();
    const n2a = new Map<string, string[]>();
    for (const an of artifactNodes) {
      const nids = a2n.get(an.artifact_id) || [];
      nids.push(an.node_id);
      a2n.set(an.artifact_id, nids);
      const aids = n2a.get(an.node_id) || [];
      aids.push(an.artifact_id);
      n2a.set(an.node_id, aids);
    }
    const byId = new Map(artifacts.map((a) => [a.id, a]));
    const rootArts = artifacts.filter((a) => !a2n.has(a.id));
    return {
      approvedNodes: approved, pendingNodes: pending, rootNodes: roots,
      childNodesMap: childMap, artifactToNodes: a2n, nodeToArtifacts: n2a,
      artifactsById: byId, rootArtifacts: rootArts, hasNodes: approved.length > 0,
    };
  }, [nodes, artifactNodes, artifacts]);

  useEffect(() => {
    if (user) return;
    const key = "stem_views";
    const viewed = JSON.parse(sessionStorage.getItem(key) || "[]") as string[];
    if (!viewed.includes(stem.id)) {
      viewed.push(stem.id);
      sessionStorage.setItem(key, JSON.stringify(viewed));
    }
    if (viewed.length >= 2) setShowSignupPrompt(true);
  }, [user, stem.id]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: stem.title,
    ...(stem.description ? { description: stem.description } : {}),
    url: `https://stem.md/${stem.username}/${stem.slug}`,
    author: {
      "@type": "Person",
      name: stem.display_name || stem.username,
      url: `https://stem.md/${stem.username}`,
    },
    numberOfItems: artifacts.length,
    itemListElement: artifacts.slice(0, 50).map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.title || f.url,
      url: f.url,
      ...(f.note || f.description ? { description: f.note || f.description } : {}),
    })),
  };

  return (
    <div style={styles.page} data-reader-open={readerOpen ? "true" : "false"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav user={user} />
      <div className="stem-page-layout">
      <main style={styles.main}>

        {/* Stem header — centered above the trunk */}
        <StemHeader
          stem={stem}
          stemCategories={stemCategories}
          isOwner={isOwner}
          onSettingsClick={() => setShowSettings(true)}
        >
          {isOwner ? (
            <OwnerActions stem={stem} artifacts={artifacts} />
          ) : (
            <VisitorActions
              stemId={stem.id}
              stem={stem}
              isFollowing={isFollowing}
              user={user}
              artifacts={artifacts}
            />
          )}
          <StemFollowers stemId={stem.id} count={followCount} />
        </StemHeader>

        {canContribute && (
          <div style={{ maxWidth: 640, margin: "0 auto 40px" }}>
            <AddArtifactForm
              stemId={stem.id}
              isOwner={isOwner}
              stemUsername={stem.username}
              contributionMode={stem.contribution_mode}
              canUpload={userHasApprovedArtifact}
            />
          </div>
        )}
        {!canContribute && !isOwner && user && stem.contribution_mode === "mutuals" && !isBranchMember && (
          <p style={styles.closedNote}>
            Only mutuals of @{stem.username} can suggest artifacts here.
          </p>
        )}

        {myPendingArtifacts.length > 0 && (
          <div style={{ ...styles.myPendingSection, maxWidth: 640, margin: "0 auto 24px" }}>
            <p style={styles.myPendingLabel}>Your pending suggestion{myPendingArtifacts.length > 1 ? "s" : ""}</p>
            {myPendingArtifacts.map((artifact) => (
              <div key={artifact.id} style={styles.pendingCard}>
                <span style={styles.pendingBadge}>Pending approval</span>
                <a href={artifact.url ?? undefined} target="_blank" rel="noopener noreferrer" style={styles.pendingTitle}>
                  {artifact.title || artifact.url}
                </a>
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <AddNodeForm stemId={stem.id} parentId={null} />
          </div>
        )}

        {/* Organic stem layout */}
        <OrganicStem
          stemId={stem.id}
          childNodesMap={childNodesMap}
          nodeToArtifacts={nodeToArtifacts}
          artifactsById={artifactsById}
          artifactToNodes={artifactToNodes}
          approvedNodes={approvedNodes}
          rootNodes={rootNodes}
          rootArtifacts={rootArtifacts}
          stemUserId={stem.user_id}
          stemUsername={stem.username}
          currentUserId={user?.id}
          isOwner={isOwner}
          canContribute={canContribute}
          contributionMode={stem.contribution_mode}
          canUpload={userHasApprovedArtifact}
        />

        {/* Pending nodes (owner review) */}
        {isOwner && pendingNodes.length > 0 && (
          <div style={styles.pendingSection}>
            <button style={styles.pendingToggle} onClick={() => setShowPendingNodes(!showPendingNodes)}>
              <span style={styles.pendingCount}>{pendingNodes.length}</span>
              {" pending node suggestion" + (pendingNodes.length > 1 ? "s" : "")}
              <span style={{ marginLeft: 6, fontSize: 10 }}>{showPendingNodes ? "▾" : "��"}</span>
            </button>
            {showPendingNodes && (
              <div style={styles.pendingList}>
                {pendingNodes.map((node) => (
                  <PendingNodeRow key={node.id} node={node} stemId={stem.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {isOwner && pendingArtifacts.length > 0 && (
          <PendingSuggestions artifacts={pendingArtifacts} stemId={stem.id} />
        )}

        {/* Related stems */}
        {relatedStems.length > 0 && (
          <div style={relatedStemStyles.section}>
            <p style={relatedStemStyles.label}>Related stems</p>
            <div style={relatedStemStyles.grid}>
              {relatedStems.map((rs) => (
                <Link
                  key={rs.id}
                  to={`/${rs.username}/${rs.slug}`}
                  style={relatedStemStyles.card}
                >
                  {rs.emoji && <span style={{ fontSize: 20 }}>{rs.emoji}</span>}
                  <span style={relatedStemStyles.title}>{rs.title}</span>
                  <span style={relatedStemStyles.meta}>
                    @{rs.username} · {rs.artifact_count} artifacts
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      {reader?.current && (
        <ArtifactReader artifact={reader.current} onClose={reader.close} />
      )}
      </div>

      {/* Settings overlay */}
      {isOwner && showSettings && (
        <div style={settingsOverlayStyles.backdrop} onClick={() => setShowSettings(false)}>
          <div style={settingsOverlayStyles.card} onClick={(e) => e.stopPropagation()}>
            <div style={settingsOverlayStyles.header}>
              <span style={settingsOverlayStyles.headerTitle}>Settings</span>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={settingsOverlayStyles.closeBtn}
              >
                {"✕"}
              </button>
            </div>
            <StemSettings stem={stem} stemCategories={stemCategories} />
            {!!stem.is_branch && (
              <BranchMembersSection stemId={stem.id} members={branchMembers} />
            )}
          </div>
        </div>
      )}

      {showSignupPrompt && !readerOpen && (
        <div style={styles.signupPrompt}>
          <p style={styles.signupText}>
            Enjoying what you see? Stem is where curious people share what they're exploring.
          </p>
          <Link to="/signin" style={styles.signupBtn}>Create an account</Link>
        </div>
      )}

      {!readerOpen && <Footer />}
    </div>
  );
}


const relatedStemStyles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 64,
    paddingTop: 32,
    borderTop: "1px solid var(--paper-dark)",
    maxWidth: 640,
    marginLeft: "auto",
    marginRight: "auto",
  },
  label: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "14px 18px",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    textDecoration: "none",
    transition: "border-color 0.15s",
  },
  title: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: "var(--ink)",
  },
  meta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
};

const settingsOverlayStyles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 100,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 80,
    overflowY: "auto",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    padding: "24px 28px",
    maxWidth: 520,
    width: "100%",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
    animation: "fadeUp 0.2s ease-out",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    fontWeight: 600,
    color: "var(--ink)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
  },
};
