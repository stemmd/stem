import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getUser, requireUser } from "~/lib/auth.server";
import { fetchOG, type OGData } from "~/lib/og.server";
import { extractYouTubeId, formatRelative, getDomain, isHttpUrl } from "~/lib/utils";
import { mutualCheckSql } from "~/lib/stems.server";
import { VisibilityPicker, ContributionPicker, CategoryPicker, CATEGORIES } from "~/components/StemPickers";
import { checkContent, checkBlockedDomain, checkRedirects } from "~/lib/moderation";
import { API_BASE } from "~/lib/config";
import { track } from "~/lib/analytics";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { nanoid } from "nanoid";
import { createNotification } from "~/lib/notifications.server";

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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  emoji: string | null;
  is_public: number;
  is_branch: number;
  visibility: string;
  contribution_mode: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface BranchMember {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface StemCategory {
  id: string;
  name: string;
  emoji: string;
}

interface Node {
  id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  emoji: string | null;
  position: number;
  status: string;
  created_by: string;
}

interface ArtifactNode {
  artifact_id: string;
  node_id: string;
  position: number;
}

interface Artifact {
  id: string;
  url: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  note: string | null;
  quote: string | null;
  source_type: string;
  embed_url: string | null;
  body: string | null;
  created_at: string;
  contributor_username: string;
  added_by: string;
}

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
           f.note, f.quote, f.source_type, f.embed_url, f.body, f.created_at, f.added_by,
           u.username as contributor_username
    FROM artifacts f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'approved'
    ORDER BY f.created_at DESC
  `;

  const pendingSql = `
    SELECT f.id, f.url, f.title, f.description, f.image_url, f.favicon_url,
           f.note, f.quote, f.source_type, f.embed_url, f.body, f.created_at, f.added_by,
           u.username as contributor_username
    FROM artifacts f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'pending'
    ORDER BY f.created_at ASC
  `;

  const [artifactsResult, followCountRow, followRow, pendingResult, mutualRow, branchMemberRow, branchMembersResult, stemCatsResult, nodesResult, artifactNodesResult] = await Promise.all([
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
      SELECT id, parent_id, title, description, emoji, position, status, created_by
      FROM nodes WHERE stem_id = ? ORDER BY position ASC
    `).bind(stem.id).all<Node>(),
    db.prepare(`
      SELECT an.artifact_id, an.node_id, an.position
      FROM artifact_nodes an
      JOIN nodes n ON n.id = an.node_id
      WHERE n.stem_id = ?
      ORDER BY an.position ASC
    `).bind(stem.id).all<ArtifactNode>(),
  ]);

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
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function checkContributionPermission(
  db: D1Database, stem: { id: string; user_id: string; is_branch: number; contribution_mode: string }, userId: string
): Promise<{ isOwner: boolean; isBranchMember: boolean; error?: string }> {
  const isOwner = userId === stem.user_id;
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

    await Promise.all([
      artifactStatus === "approved"
        ? db.prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?").bind(stem.id).run()
        : Promise.resolve(),
      createNotification({
        db, userId: stem.user_id, type: "new_artifact", actorId: user.id, stemId: stem.id, artifactId,
      }),
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

    await Promise.all([
      artifactStatus === "approved"
        ? db.prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?").bind(stem.id).run()
        : Promise.resolve(),
      createNotification({
        db, userId: stem.user_id, type: "new_artifact", actorId: user.id, stemId: stem.id, artifactId,
      }),
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
    const VALID_TYPES = ["article","book","paper","podcast","video","tool","person","place","concept","wikipedia","youtube","arxiv"];
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

    // Enforce 3-level nesting cap
    if (parentId) {
      let depth = 0;
      let currentId: string | null = parentId;
      while (currentId) {
        const parent = await db.prepare("SELECT parent_id FROM nodes WHERE id = ?")
          .bind(currentId).first<{ parent_id: string | null }>();
        currentId = parent?.parent_id ?? null;
        depth++;
      }
      if (depth >= 3) {
        return json({ error: "Maximum nesting depth (3 levels) reached." }, { status: 400 });
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
    const nodeIds = JSON.parse(form.get("nodeIds") as string) as string[];
    await db.batch(
      nodeIds.map((id, i) =>
        db.prepare("UPDATE nodes SET position = ? WHERE id = ? AND stem_id = ?")
          .bind(i * 1000, id, stem.id)
      )
    );
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

    const lastPos = await db.prepare(
      "SELECT MAX(position) as maxPos FROM artifact_nodes WHERE node_id = ?"
    ).bind(nodeId).first<{ maxPos: number | null }>();
    const position = (lastPos?.maxPos ?? -1000) + 1000;

    const id = `an_${nanoid(10)}`;
    await db.prepare(
      "INSERT OR IGNORE INTO artifact_nodes (id, artifact_id, node_id, position) VALUES (?, ?, ?, ?)"
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

export default function StemPage() {
  const { stem, artifacts, pendingArtifacts, myPendingArtifacts, user, isOwner, isBranchMember, isFollowing, followCount, canContribute, branchMembers, stemCategories, nodes, artifactNodes } =
    useLoaderData<typeof loader>();

  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [mapView, setMapView] = useState(false);

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
    <div style={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav user={user} />
      <main style={styles.main}>

        <div style={styles.stemHeader}>
          <div style={styles.stemMeta}>
            <Link to={`/${stem.username}`} style={styles.authorLink}>
              @{stem.username}
            </Link>
            {!!stem.is_branch && (
              <span style={styles.branchBadge}>Branch</span>
            )}
            {stem.visibility !== "public" && (
              <span style={styles.privateBadge}>{stem.visibility}</span>
            )}
          </div>

          {stem.emoji && <span style={styles.stemEmoji}>{stem.emoji}</span>}
          <h1 style={styles.stemTitle}>{stem.title}</h1>

          {stem.description && (
            <p style={styles.stemDesc}>{stem.description}</p>
          )}

          {stemCategories.length > 0 && (
            <div style={styles.stemCatRow}>
              {stemCategories.map((cat) => (
                <span key={cat.id} style={styles.stemCatPill}>
                  {cat.emoji} {cat.name}
                </span>
              ))}
            </div>
          )}

          <div style={styles.stemActions}>
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
          </div>
        </div>

        {canContribute && (
          <AddArtifactForm
            stemId={stem.id}
            isOwner={isOwner}
            stemUsername={stem.username}
            contributionMode={stem.contribution_mode}
          />
        )}
        {!canContribute && !isOwner && user && stem.contribution_mode === "mutuals" && !isBranchMember && (
          <p style={styles.closedNote}>
            Only mutuals of @{stem.username} can suggest artifacts here.
          </p>
        )}

        {myPendingArtifacts.length > 0 && (
          <div style={styles.myPendingSection}>
            <p style={styles.myPendingLabel}>Your pending suggestion{myPendingArtifacts.length > 1 ? "s" : ""}</p>
            {myPendingArtifacts.map((artifact) => (
              <div key={artifact.id} style={styles.pendingCard}>
                <span style={styles.pendingBadge}>Pending approval</span>
                <a href={artifact.url} target="_blank" rel="noopener noreferrer" style={styles.pendingTitle}>
                  {artifact.title || artifact.url}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Map view toggle */}
        {hasNodes && approvedNodes.length >= 2 && (
          <button
            onClick={() => setMapView((v) => !v)}
            style={styles.mapToggle}
            title={mapView ? "Switch to outline" : "Switch to map"}
          >
            {mapView ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 5.5L7 10.5M10.5 5.5L9 10.5" stroke="currentColor" strokeWidth="1"/></svg>
            )}
          </button>
        )}

        {mapView ? (
          <NodeMapView
            nodes={approvedNodes}
            childNodesMap={childNodesMap}
            nodeToArtifacts={nodeToArtifacts}
          />
        ) : (
          <>
            {/* Nodes with their artifacts */}
            {rootNodes.map((node) => (
              <NodeSection
                key={node.id}
                node={node}
                depth={0}
                childNodesMap={childNodesMap}
                nodeToArtifacts={nodeToArtifacts}
                artifactsById={artifactsById}
                artifactToNodes={artifactToNodes}
                approvedNodes={approvedNodes}
                stemUserId={stem.user_id}
                currentUserId={user?.id}
                stemUsername={stem.username}
                isOwner={isOwner}
                stemId={stem.id}
              />
            ))}

            {/* Add node button (owner) */}
            {isOwner && (
              <AddNodeForm stemId={stem.id} parentId={null} />
            )}

            {/* Root-level artifacts (not in any node) */}
            {hasNodes && rootArtifacts.length > 0 && (
              <div style={styles.rootArtifactsLabel}>Uncategorized</div>
            )}
            <div style={styles.artifactsList}>
              {!hasNodes && artifacts.length === 0 ? (
                <p style={styles.empty}>
                  {isOwner
                    ? "Paste a URL above to add your first artifact."
                    : "No artifacts yet."}
                </p>
              ) : (
                (hasNodes ? rootArtifacts : artifacts).map((artifact) => (
                  <ArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    stemId={stem.id}
                    stemUserId={stem.user_id}
                    currentUserId={user?.id}
                    stemUsername={stem.username}
                    nodeNames={
                      artifactToNodes.has(artifact.id)
                        ? artifactToNodes.get(artifact.id)!.map(
                            (nid) => approvedNodes.find((n) => n.id === nid)?.title ?? ""
                          ).filter(Boolean)
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Pending nodes (owner review) */}
        {isOwner && pendingNodes.length > 0 && (
          <div style={styles.pendingSection}>
            <button style={styles.pendingToggle} onClick={() => {}}>
              <span style={styles.pendingCount}>{pendingNodes.length}</span>
              {" pending node suggestion" + (pendingNodes.length > 1 ? "s" : "")}
            </button>
            <div style={styles.pendingList}>
              {pendingNodes.map((node) => (
                <PendingNodeRow key={node.id} node={node} stemId={stem.id} />
              ))}
            </div>
          </div>
        )}

        {isOwner && pendingArtifacts.length > 0 && (
          <PendingSuggestions artifacts={pendingArtifacts} stemId={stem.id} />
        )}

        {isOwner && !!stem.is_branch && (
          <BranchMembersSection stemId={stem.id} members={branchMembers} />
        )}

        {isOwner && (
          <StemSettings stem={stem} stemCategories={stemCategories} />
        )}
      </main>

      {showSignupPrompt && (
        <div style={styles.signupPrompt}>
          <p style={styles.signupText}>
            Enjoying what you see? Stem is where curious people share what they're exploring.
          </p>
          <Link to="/signin" style={styles.signupBtn}>Create an account</Link>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ── Stem followers popup ─────────────────────────────────────────────────────

function StemFollowers({ stemId, count }: { stemId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const [followers, setFollowers] = useState<{ username: string; display_name: string | null; avatar_url: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = async () => {
    if (count === 0) return;
    setOpen(!open);
    if (!loaded) {
      try {
        const res = await fetch(`${API_BASE}/stems/${stemId}/followers`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setFollowers(data.followers || []);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          ...styles.followCount,
          cursor: count > 0 ? "pointer" : "default",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        {count} {count === 1 ? "follower" : "followers"}
      </button>
      {open && (
        <div style={styles.followerPopup}>
          {followers.length === 0 ? (
            <p style={styles.followerEmpty}>Loading...</p>
          ) : (
            followers.map((f) => (
              <Link
                key={f.username}
                to={`/${f.username}`}
                style={styles.followerRow}
                onClick={() => setOpen(false)}
              >
                <span style={styles.followerAvatar}>
                  {f.avatar_url ? (
                    <img src={f.avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                  ) : (
                    f.username.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span>{f.display_name || f.username}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Owner actions bar ─────────────────────────────────────────────────────────

function OwnerActions({ stem, artifacts }: { stem: Stem; artifacts: Artifact[] }) {
  return (
    <>
      <ShareButton stem={stem} />
      <ExportButton stem={stem} artifacts={artifacts} />
    </>
  );
}

// ── Visitor actions bar ───────────────────────────────────────────────────────

function VisitorActions({
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

// ── Add artifact form ────────────────────────────────────────────────────────

const ARTIFACT_TYPES: { value: string; label: string; emoji: string }[] = [
  { value: "article", label: "Article", emoji: "📄" },
  { value: "book", label: "Book", emoji: "📖" },
  { value: "paper", label: "Paper", emoji: "🔬" },
  { value: "podcast", label: "Podcast", emoji: "🎙️" },
  { value: "video", label: "Video", emoji: "🎥" },
  { value: "tool", label: "Tool", emoji: "🔧" },
  { value: "person", label: "Person", emoji: "👤" },
  { value: "place", label: "Place", emoji: "📍" },
  { value: "concept", label: "Concept", emoji: "💭" },
  { value: "wikipedia", label: "Wikipedia", emoji: "📚" },
  { value: "note", label: "Note", emoji: "📝" },
  { value: "image", label: "Image", emoji: "🖼️" },
  { value: "pdf", label: "PDF", emoji: "📑" },
  { value: "audio", label: "Audio", emoji: "🎧" },
];

function artifactTypeLabel(type: string): { label: string; emoji: string } {
  if (type === "youtube") return { label: "Video", emoji: "🎥" };
  if (type === "arxiv") return { label: "Paper", emoji: "🔬" };
  return ARTIFACT_TYPES.find((t) => t.value === type) ?? { label: "Article", emoji: "📄" };
}

type ArtifactTab = "link" | "note" | "image" | "file" | "audio";

function AddArtifactForm({
  stemId,
  isOwner,
  stemUsername,
  contributionMode,
}: {
  stemId: string;
  isOwner: boolean;
  stemUsername: string;
  contributionMode: string;
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState("");
  const [artifactType, setArtifactType] = useState("");
  const [open, setOpen] = useState(isOwner);
  const [tab, setTab] = useState<ArtifactTab>("link");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

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
    }
  }, [addFetcher.state, addFetcher.data]);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.startsWith("http")) return;

    debounceRef.current = setTimeout(() => {
      ogFetcher.load(`/api/og?url=${encodeURIComponent(val)}`);
    }, 500);
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

  const TABS: { key: ArtifactTab; label: string; emoji: string; disabled?: boolean }[] = [
    { key: "link", label: "Link", emoji: "🔗" },
    { key: "note", label: "Note", emoji: "📝" },
    { key: "image", label: "Image", emoji: "🖼️", disabled: true },
    { key: "file", label: "File", emoji: "📎", disabled: true },
    { key: "audio", label: "Audio", emoji: "🎧", disabled: true },
  ];

  const tabBar = (
    <div style={styles.tabRow}>
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          disabled={t.disabled}
          onClick={() => !t.disabled && setTab(t.key)}
          style={{
            ...styles.tabBtn,
            borderBottomColor: tab === t.key ? "var(--forest)" : "transparent",
            color: t.disabled ? "var(--ink-light)" : tab === t.key ? "var(--forest)" : "var(--ink-mid)",
            opacity: t.disabled ? 0.5 : 1,
            cursor: t.disabled ? "not-allowed" : "pointer",
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
        {tabBar}
        <input
          type="text"
          name="title"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note title (optional)"
          style={styles.noteInput}
        />
        <textarea
          name="body"
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Write your note..."
          rows={5}
          style={{ ...styles.quoteInput, fontFamily: "'DM Sans', sans-serif", fontStyle: "normal" }}
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

  if (tab === "image" || tab === "file" || tab === "audio") {
    return (
      <div style={styles.addArtifactForm}>
        {tabBar}
        <div style={styles.comingSoon}>
          <p style={styles.comingSoonText}>
            {tab === "image" ? "🖼️" : tab === "file" ? "📎" : "🎧"}
          </p>
          <p style={styles.comingSoonText}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)} uploads coming soon
          </p>
          <p style={{ ...styles.comingSoonText, fontSize: 12, color: "var(--ink-light)" }}>
            For now, you can share links or write notes
          </p>
        </div>
      </div>
    );
  }

  return (
    <addFetcher.Form method="post" style={styles.addArtifactForm}>
      <input type="hidden" name="intent" value="add_artifact" />
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

// ── Pending suggestions (owner) ───────────────────────────────────────────────

function PendingSuggestions({ artifacts, stemId }: { artifacts: Artifact[]; stemId: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={styles.pendingSection}>
      <button style={styles.pendingToggle} onClick={() => setOpen((o) => !o)}>
        <span style={styles.pendingCount}>{artifacts.length}</span>
        {artifacts.length === 1 ? " pending suggestion" : " pending suggestions"}
        <span style={{ marginLeft: 6, color: "var(--ink-light)" }}>{open ? "▲" : "▼"}</span>
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

function PendingArtifactRow({ artifact, stemId }: { artifact: Artifact; stemId: string }) {
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
        <p style={styles.pendingMeta}>by @{artifact.contributor_username}{artifact.url ? ` · ${getDomain(artifact.url)}` : " · note"}</p>
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

// ── Branch members (owner) ────────────────────────────────────────────────────

function BranchMembersSection({ stemId, members }: { stemId: string; members: BranchMember[] }) {
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
        Branch Members ({members.length}) {open ? "▲" : "▼"}
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

function BranchMemberRow({ member, stemId }: { member: BranchMember; stemId: string }) {
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

// ── Stem settings (owner) ─────────────────────────────────────────────────────


function StemSettings({ stem, stemCategories }: { stem: Stem; stemCategories: StemCategory[] }) {
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
        Settings {open ? "▲" : "▼"}
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
            <input
              type="text"
              value={emoji}
              onChange={(e) => { const v = [...e.target.value].slice(-1).join(""); setEmoji(v); }}
              placeholder="🌱"
              style={styles.settingsEmojiCustom}
              title="Type any emoji"
            />
            <input type="hidden" name="emoji" value={emoji} />
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
              {fetcher.state !== "idle" ? "Saving…" : "Save settings"}
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
                  {deleteFetcher.state !== "idle" ? "Deleting…" : "Delete everything"}
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

// ── Node section (collapsible outline) ───────────────────────────────────────

function NodeSection({
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
        <span style={styles.nodeChevron}>{expanded ? "▾" : "▸"}</span>
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
              <input
                type="text"
                name="emoji"
                defaultValue={node.emoji ?? ""}
                placeholder="Emoji (optional)"
                style={{ ...styles.noteInput, width: 60 }}
              />
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

// ── Add node form ────────────────────────────────────────────────────────────

function AddNodeForm({ stemId, parentId }: { stemId: string; parentId: string | null }) {
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
        <input
          type="text"
          value={emoji}
          onChange={(e) => { const v = [...e.target.value].slice(-1).join(""); setEmoji(v); }}
          placeholder="🏷"
          style={styles.settingsEmojiCustom}
          name="emoji"
        />
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
          {fetcher.state !== "idle" ? "Adding…" : "Add"}
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

// ── Pending node row (owner review) ─────────────────────────────────────────

function PendingNodeRow({ node, stemId }: { node: Node; stemId: string }) {
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

// ── Node map view (force-directed SVG) ───────────────────────────────────────

function NodeMapView({
  nodes,
  childNodesMap,
  nodeToArtifacts,
}: {
  nodes: Node[];
  childNodesMap: Map<string, Node[]>;
  nodeToArtifacts: Map<string, string[]>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [edges, setEdges] = useState<[number, number][]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;
    const W = 600, H = 360;
    // Initialize positions in a circle
    const pos = nodes.map((_, i) => ({
      x: W / 2 + Math.cos((2 * Math.PI * i) / nodes.length) * 120 + (Math.random() - 0.5) * 20,
      y: H / 2 + Math.sin((2 * Math.PI * i) / nodes.length) * 100 + (Math.random() - 0.5) * 20,
    }));
    const vel = nodes.map(() => ({ x: 0, y: 0 }));
    const nodeIndex = new Map(nodes.map((n, i) => [n.id, i]));

    // Build edges
    const simEdges: [number, number][] = [];
    for (const n of nodes) {
      const children = childNodesMap.get(n.id) || [];
      const pi = nodeIndex.get(n.id)!;
      for (const c of children) {
        const ci = nodeIndex.get(c.id);
        if (ci !== undefined) simEdges.push([pi, ci]);
      }
    }

    let frame = 0;
    let rafId = 0;
    const maxFrames = 100;
    const tick = () => {
      if (frame >= maxFrames) {
        setPositions([...pos]);
        setEdges(simEdges);
        return;
      }
      // Repulsion
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 3000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          vel[i].x += fx; vel[i].y += fy;
          vel[j].x -= fx; vel[j].y -= fy;
        }
      }
      // Attraction (edges)
      for (const [a, b] of simEdges) {
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.05;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        vel[a].x += fx; vel[a].y += fy;
        vel[b].x -= fx; vel[b].y -= fy;
      }
      // Center gravity
      for (let i = 0; i < pos.length; i++) {
        vel[i].x += (W / 2 - pos[i].x) * 0.01;
        vel[i].y += (H / 2 - pos[i].y) * 0.01;
      }
      // Apply velocity with damping
      for (let i = 0; i < pos.length; i++) {
        vel[i].x *= 0.85; vel[i].y *= 0.85;
        pos[i].x += vel[i].x; pos[i].y += vel[i].y;
        pos[i].x = Math.max(40, Math.min(W - 40, pos[i].x));
        pos[i].y = Math.max(40, Math.min(H - 40, pos[i].y));
      }
      frame++;
      if (frame < maxFrames) rafId = requestAnimationFrame(tick);
      else { setPositions([...pos]); setEdges(simEdges); }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [nodes.length]);

  if (positions.length === 0) return null;

  return (
    <div style={{ marginBottom: 24, borderRadius: 12, overflow: "hidden", border: "1px solid var(--paper-dark)", background: "var(--surface)" }}>
      <svg ref={svgRef} viewBox="0 0 600 360" style={{ width: "100%", maxHeight: 360, display: "block" }}>
        {/* Edges */}
        {edges.map(([a, b], i) => (
          <line
            key={`e${i}`}
            x1={positions[a].x} y1={positions[a].y}
            x2={positions[b].x} y2={positions[b].y}
            stroke="var(--paper-dark)" strokeWidth="1.5"
          />
        ))}
        {/* Nodes */}
        {nodes.map((node, i) => {
          const count = (nodeToArtifacts.get(node.id) || []).length;
          const r = Math.max(16, Math.min(34, 12 + count * 3));
          return (
            <g key={node.id}>
              <circle
                cx={positions[i].x} cy={positions[i].y} r={r}
                fill="var(--leaf)" stroke="var(--forest)" strokeWidth="1.5"
              />
              <text
                x={positions[i].x} y={positions[i].y - r - 6}
                textAnchor="middle"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fill: "var(--ink-mid)" }}
              >
                {node.emoji ? `${node.emoji} ` : ""}{node.title}
              </text>
              <text
                x={positions[i].x} y={positions[i].y + 4}
                textAnchor="middle"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fill: "var(--forest)" }}
              >
                {count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Artifact card ────────────────────────────────────────────────────────────

function ArtifactCard({
  artifact,
  stemId,
  stemUserId,
  currentUserId,
  stemUsername,
  nodeNames,
}: {
  artifact: Artifact;
  stemId: string;
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
  nodeNames?: string[];
}) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();
  const reportFetcher = useFetcher<{ reported?: boolean }>();
  const canEdit = currentUserId === artifact.added_by || currentUserId === stemUserId;
  const canReport = !!currentUserId && currentUserId !== artifact.added_by;
  const reported = reportFetcher.data?.reported === true;
  const isDeleting =
    deleteFetcher.state !== "idle" &&
    deleteFetcher.formData?.get("artifactId") === artifact.id;
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(artifact.note ?? "");
  const [editQuote, setEditQuote] = useState(artifact.quote ?? "");
  const [editType, setEditType] = useState(artifact.source_type);

  // Close edit panel after save
  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.success) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  if (isDeleting) return null;

  const isNote = artifact.source_type === "note";
  const domain = artifact.url ? getDomain(artifact.url) : null;
  const showContributor = artifact.contributor_username !== stemUsername;
  const embedId = !isNote && artifact.embed_url ? null : (!isNote && artifact.source_type === "youtube" && artifact.url ? extractYouTubeId(artifact.url) : null);
  const embedUrl = !isNote ? (artifact.embed_url || (embedId ? `https://www.youtube.com/embed/${embedId}` : null)) : null;
  const typeInfo = artifactTypeLabel(artifact.source_type);

  return (
    <div style={styles.artifactCard}>
      {/* Note-type artifact */}
      {isNote && (
        <div style={styles.artifactBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={styles.artifactTypeBadge}>📝</span>
            {artifact.title && <span style={{ ...styles.artifactTitle, cursor: "default" }}>{artifact.title}</span>}
          </div>
          {artifact.body && (
            <p style={styles.noteBody}>{artifact.body}</p>
          )}
          <div style={styles.artifactFooter}>
            {showContributor && (
              <span style={styles.contributor}>by @{artifact.contributor_username}</span>
            )}
            <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
            {canEdit && (
              <deleteFetcher.Form method="post">
                <input type="hidden" name="intent" value="delete_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
              </deleteFetcher.Form>
            )}
          </div>
          {/* "Also in" node tags */}
          {nodeNames && nodeNames.length > 0 && (
            <div style={styles.alsoInRow}>
              <span style={styles.alsoInLabel}>Also in:</span>
              {nodeNames.map((name) => (
                <span key={name} style={styles.alsoInTag}>{name}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Link-type artifact */}
      {!isNote && embedUrl && (
        <iframe
          src={embedUrl}
          style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 8, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      {!isNote && <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {!embedUrl && artifact.image_url && (
        <img
          src={artifact.image_url}
          alt=""
          style={styles.artifactThumb}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div style={{ ...styles.artifactBody, flex: 1 }}>
        <a
          href={artifact.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.artifactTitle}
          onClick={() => track("open_link", { stem_id: stemId, artifact_id: artifact.id })}
        >
          {artifact.title || artifact.url}
        </a>

        {artifact.note && <p style={styles.artifactNote}>{artifact.note}</p>}

        {artifact.quote && (
          <blockquote style={styles.artifactQuote}>"{artifact.quote}"</blockquote>
        )}

        <div style={styles.artifactFooter}>
          <span style={styles.artifactTypeBadge} title={typeInfo.label}>
            {typeInfo.emoji}
          </span>
          <span style={styles.artifactDomain}>
            {artifact.favicon_url && (
              <img src={artifact.favicon_url} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
            )}
            {domain}
          </span>
          {showContributor && (
            <span style={styles.contributor}>via @{artifact.contributor_username}</span>
          )}
          <span style={styles.timestamp}>{formatRelative(artifact.created_at)}</span>
          {canReport && !canEdit && (
            reported ? (
              <span style={{ ...styles.timestamp, color: "var(--ink-light)" }}>Reported</span>
            ) : (
              <reportFetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="intent" value="report_artifact" />
                <input type="hidden" name="artifactId" value={artifact.id} />
                <button type="submit" style={styles.reportBtn} title="Report this artifact">⚑</button>
              </reportFetcher.Form>
            )
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => { setEditing((e) => !e); setEditNote(artifact.note ?? ""); setEditQuote(artifact.quote ?? ""); setEditType(artifact.source_type); }}
              style={{ ...styles.deleteBtn, marginLeft: "auto" }}
              title="Edit artifact"
            >
              ✏
            </button>
          )}
          {canEdit && (
            <deleteFetcher.Form method="post">
              <input type="hidden" name="intent" value="delete_artifact" />
              <input type="hidden" name="artifactId" value={artifact.id} />
              <button type="submit" style={styles.deleteBtn} title="Remove artifact">×</button>
            </deleteFetcher.Form>
          )}
        </div>

        {/* "Also in" node tags */}
        {nodeNames && nodeNames.length > 0 && (
          <div style={styles.alsoInRow}>
            <span style={styles.alsoInLabel}>Also in:</span>
            {nodeNames.map((name) => (
              <span key={name} style={styles.alsoInTag}>{name}</span>
            ))}
          </div>
        )}

        {editing && (
          <editFetcher.Form method="post" style={styles.editForm}>
            <input type="hidden" name="intent" value="edit_artifact" />
            <input type="hidden" name="artifactId" value={artifact.id} />
            <div style={styles.typePickerRow}>
              {ARTIFACT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEditType(t.value)}
                  style={{
                    ...styles.typePill,
                    background: editType === t.value ? "var(--leaf)" : "transparent",
                    borderColor: editType === t.value ? "var(--forest)" : "var(--paper-dark)",
                    color: editType === t.value ? "var(--forest)" : "var(--ink-light)",
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <input type="hidden" name="artifact_type" value={editType} />
            <input
              type="text"
              name="note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Note (optional)"
              style={{ ...styles.noteInput, width: "100%", boxSizing: "border-box" as const }}
            />
            <textarea
              name="quote"
              value={editQuote}
              onChange={(e) => setEditQuote(e.target.value)}
              placeholder="Key quote (optional)"
              maxLength={300}
              rows={2}
              style={styles.quoteInput}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={editFetcher.state !== "idle"} style={styles.settingsSaveBtn}>
                {editFetcher.state !== "idle" ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditing(false)} style={styles.subtleBtn}>
                Cancel
              </button>
            </div>
            {editFetcher.data?.error && (
              <p style={{ fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace" }}>{editFetcher.data.error}</p>
            )}
          </editFetcher.Form>
        )}
      </div>
      </div>}
    </div>
  );
}

// ── Share ─────────────────────────────────────────────────────────────────────

function ShareButton({ stem }: { stem: Stem }) {
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

// ── Export ────────────────────────────────────────────────────────────────────

function ExportButton({ stem, artifacts }: { stem: Stem; artifacts: Artifact[] }) {
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
        (f) => `- [${f.title || f.url}](${f.url})${f.note ? `\n  > ${f.note}` : ""}`
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 680, margin: "0 auto", padding: "40px 24px" },

  stemHeader: { marginBottom: 40 },
  stemEmoji: { fontSize: 40, lineHeight: 1, display: "block", marginBottom: 8 },
  stemMeta: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  authorLink: {
    fontFamily: "'DM Mono', monospace", fontSize: 13,
    color: "var(--ink-light)", textDecoration: "none",
  },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 400, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12,
  },
  stemDesc: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 16,
    color: "var(--ink-mid)", lineHeight: 1.6, marginBottom: 20, maxWidth: 520,
  },
  stemActions: {
    display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" as const,
  },
  followPill: {
    display: "inline-block", padding: "7px 18px",
    border: "1px solid var(--forest)", borderRadius: 20,
    color: "var(--forest)", background: "transparent",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13,
    cursor: "pointer", textDecoration: "none", transition: "all 0.15s",
  },
  subtleBtn: {
    background: "none", border: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", cursor: "pointer", padding: 0,
    textDecoration: "underline", textDecorationColor: "var(--paper-dark)",
  },
  followCount: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", marginLeft: "auto",
  },
  followerPopup: {
    position: "absolute" as const, right: 0, top: "100%", marginTop: 8,
    background: "var(--surface)", border: "1px solid var(--paper-dark)",
    borderRadius: 10, padding: 8, minWidth: 200, maxHeight: 240,
    overflowY: "auto" as const, zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },
  followerRow: {
    display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
    textDecoration: "none", color: "var(--ink)", borderRadius: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  },
  followerAvatar: {
    width: 24, height: 24, borderRadius: "50%", background: "var(--paper-mid)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 9, fontWeight: 600, color: "var(--ink-mid)", flexShrink: 0,
    overflow: "hidden" as const,
  },
  followerEmpty: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", padding: "8px 12px",
  },

  // Add artifact form
  contributeBtn: {
    display: "block", width: "100%", padding: "12px 20px",
    background: "transparent", border: "1.5px dashed var(--paper-dark)",
    borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", cursor: "pointer", marginBottom: 32, textAlign: "center" as const,
  },
  addArtifactForm: {
    display: "flex", flexDirection: "column" as const, gap: 10,
    marginBottom: 40, padding: 20,
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 12,
  },
  urlRow: { display: "flex", alignItems: "center", gap: 8 },
  urlInput: {
    flex: 1, padding: "10px 14px",
    background: "var(--paper-mid)", border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, fontSize: 14,
    fontFamily: "'DM Mono', monospace", color: "var(--ink)", outline: "none",
  },
  fetchingDot: {
    fontFamily: "'DM Mono', monospace", color: "var(--ink-light)", fontSize: 20,
  },
  previewCard: {
    display: "flex", gap: 12, padding: "10px 14px",
    background: "var(--paper)", borderRadius: 8, alignItems: "flex-start",
  },
  previewThumb: {
    width: 48, height: 48, borderRadius: 6,
    objectFit: "cover" as const, flexShrink: 0,
  },
  previewTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    fontWeight: 500, color: "var(--ink)", marginBottom: 4,
  },
  previewDomain: {
    display: "flex", alignItems: "center", gap: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  noteRow: { display: "flex", gap: 8, alignItems: "center" },
  noteInput: {
    flex: 1, padding: "8px 14px",
    background: "var(--paper-mid)", border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", color: "var(--ink)", outline: "none",
  },
  addBtn: {
    padding: "8px 20px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    whiteSpace: "nowrap" as const, flexShrink: 0,
  },

  // Artifact list
  artifactsList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  artifactCard: {
    display: "flex", flexDirection: "column" as const, gap: 10, padding: 16,
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 12,
    animation: "fadeUp 0.2s ease",
  },
  artifactThumb: {
    width: 48, height: 48, borderRadius: 6,
    objectFit: "cover" as const, flexShrink: 0,
  },
  artifactBody: {
    display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0,
  },
  artifactTitle: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 15,
    color: "var(--ink)", textDecoration: "none",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
    display: "block",
  },
  artifactNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", fontStyle: "italic" as const,
  },
  artifactFooter: {
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 2,
  },
  artifactDomain: {
    display: "flex", alignItems: "center", gap: 4,
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  contributor: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  timestamp: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)",
  },
  reportBtn: {
    background: "none", border: "none", padding: "0 4px",
    fontFamily: "sans-serif", fontSize: 14, color: "var(--ink-light)",
    cursor: "pointer", opacity: 0.6,
  },
  deleteBtn: {
    background: "none", border: "none", padding: "0 4px",
    fontSize: 18, lineHeight: 1, color: "var(--ink-light)",
    cursor: "pointer", opacity: 0.5,
  },

  empty: {
    fontFamily: "'DM Serif Display', serif", fontStyle: "italic" as const,
    fontSize: 18, color: "var(--ink-light)", textAlign: "center" as const, padding: "60px 0",
  },

  stemCatRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16,
  },
  stemCatPill: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--forest)",
    background: "var(--leaf)", border: "1px solid var(--leaf-border)",
    padding: "3px 10px", borderRadius: 20,
  },
  branchBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--forest)",
    background: "var(--leaf)", padding: "2px 8px", borderRadius: 10,
  },
  privateBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--ink-light)",
    background: "var(--paper-mid)", padding: "2px 8px", borderRadius: 10,
  },
  branchMemberRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 12px", background: "var(--surface)",
    border: "1px solid var(--paper-dark)", borderRadius: 8,
  },
  branchMemberName: {
    fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink)",
  },
  branchMemberDisplay: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
  },
  closedNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    fontStyle: "italic" as const, marginBottom: 32, textAlign: "center" as const,
  },

  // My pending artifacts (non-owner)
  myPendingSection: {
    marginBottom: 24, padding: "12px 16px",
    background: "var(--paper-mid)", borderRadius: 10,
    border: "1px dashed var(--paper-dark)",
  },
  myPendingLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)", marginBottom: 8,
  },
  pendingCard: {
    display: "flex", flexDirection: "column" as const, gap: 4,
  },
  pendingBadge: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--ink-light)", background: "var(--paper-dark)",
    padding: "2px 8px", borderRadius: 10, alignSelf: "flex-start" as const,
  },
  pendingTitle: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--ink)",
    textDecoration: "none", fontWeight: 500,
  },

  // Pending suggestions section (owner)
  pendingSection: {
    marginTop: 40, borderTop: "1px solid var(--paper-dark)", paddingTop: 24,
  },
  pendingToggle: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
    color: "var(--ink)", display: "flex", alignItems: "center", gap: 6,
  },
  pendingCount: {
    background: "var(--forest)", color: "#fff",
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    padding: "2px 7px", borderRadius: 10,
  },
  pendingList: {
    display: "flex", flexDirection: "column" as const, gap: 12, marginTop: 16,
  },
  pendingRow: {
    display: "flex", alignItems: "flex-start", gap: 16,
    padding: 16, background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 10,
  },
  pendingNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-mid)",
    fontStyle: "italic" as const, marginTop: 2,
  },
  pendingMeta: {
    fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)", marginTop: 4,
  },
  approveBtn: {
    padding: "6px 14px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: "pointer",
  },
  rejectBtn: {
    padding: "6px 14px", background: "none", color: "var(--taken)",
    border: "1px solid var(--taken)", borderRadius: 6, fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },

  // Settings section (owner)
  settingsSection: {
    marginTop: 40, borderTop: "1px solid var(--paper-dark)", paddingTop: 24,
  },
  settingsToggle: {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)",
    display: "flex", alignItems: "center", gap: 6,
  },
  settingsForm: {
    display: "flex", flexDirection: "column" as const, gap: 20,
    marginTop: 16, padding: 20,
    background: "var(--paper-mid)", borderRadius: 10,
    border: "1px solid var(--paper-dark)",
  },
  settingsDivider: {
    height: 1, background: "var(--paper-dark)",
  },
  settingsSaveBtn: {
    padding: "8px 20px", background: "var(--forest)", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  typePickerRow: {
    display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 4,
  },
  typePill: {
    padding: "3px 10px", borderRadius: 20, border: "1.5px solid",
    fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
    background: "transparent", transition: "background 0.1s, border-color 0.1s",
  },
  artifactTypeBadge: {
    fontSize: 13, flexShrink: 0,
  },
  artifactQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 14,
    color: "var(--ink-mid)",
    borderLeft: "2px solid var(--paper-dark)",
    paddingLeft: 10,
    margin: "6px 0",
    lineHeight: 1.5,
  },
  quoteInput: {
    width: "100%",
    padding: "8px 12px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    color: "var(--ink)",
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  },
  editForm: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: "12px",
    background: "var(--paper-mid)",
    borderRadius: 8,
    border: "1px solid var(--paper-dark)",
  },
  dangerBtn: {
    padding: "8px 16px", background: "transparent",
    color: "var(--taken)", border: "1px solid var(--taken)",
    borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  settingsFieldLabel: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", fontWeight: 500,
  },
  settingsEmojiCustom: {
    width: 56, height: 48, borderRadius: 8,
    border: "1.5px solid var(--paper-dark)",
    background: "var(--paper-mid)", fontSize: 26,
    textAlign: "center" as const, outline: "none", padding: 0,
    fontFamily: "sans-serif", color: "var(--ink)", marginTop: 8,
  },

  signupPrompt: {
    padding: "24px 32px",
    borderTop: "1px solid var(--paper-dark)",
    background: "var(--leaf)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    flexWrap: "wrap" as const,
  },
  signupText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    textAlign: "center" as const,
  },
  signupBtn: {
    padding: "8px 20px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    flexShrink: 0,
  },

  // Tab styles
  tabRow: {
    display: "flex", gap: 0, borderBottom: "1px solid var(--paper-dark)",
    marginBottom: 12,
  },
  tabBtn: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    padding: "6px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
  },
  noteBody: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink)", lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
  comingSoon: {
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    justifyContent: "center", gap: 8, padding: "32px 16px",
  },
  comingSoonText: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", textAlign: "center" as const,
  },

  // Node styles
  nodeSection: {
    marginBottom: 8,
    borderLeft: "2px solid var(--paper-dark)",
  },
  nodeHeader: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", fontSize: 15,
    color: "var(--ink)", width: "100%", textAlign: "left" as const,
  },
  nodeChevron: {
    fontSize: 12, color: "var(--ink-light)", flexShrink: 0, width: 14,
  },
  nodeEmoji: {
    fontSize: 18, flexShrink: 0,
  },
  nodeTitle: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15,
    color: "var(--ink)", flex: 1, minWidth: 0,
  },
  nodeCount: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", flexShrink: 0,
  },
  nodeContent: {
    paddingLeft: 14, paddingBottom: 8,
    display: "flex", flexDirection: "column" as const, gap: 8,
  },
  nodeDesc: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", paddingLeft: 22, marginBottom: 4,
  },
  nodeActions: {
    display: "flex", gap: 12, paddingLeft: 22, marginTop: 4,
  },
  addNodeBtn: {
    display: "block", padding: "8px 16px",
    background: "none", border: "1.5px dashed var(--paper-dark)",
    borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-light)", cursor: "pointer", marginTop: 4, marginBottom: 8,
  },
  addNodeForm: {
    display: "flex", flexDirection: "column" as const, gap: 8,
    padding: "12px 16px", marginTop: 4, marginBottom: 8,
    background: "var(--paper-mid)", borderRadius: 8,
    border: "1px solid var(--paper-dark)",
  },
  rootArtifactsLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 12,
    color: "var(--ink-light)", textTransform: "uppercase" as const,
    letterSpacing: "0.08em", marginTop: 24, marginBottom: 8,
    paddingBottom: 8, borderBottom: "1px solid var(--paper-dark)",
  },
  mapToggle: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 32, height: 32, borderRadius: 8,
    background: "var(--paper-mid)", border: "1px solid var(--paper-dark)",
    cursor: "pointer", color: "var(--ink-light)", marginBottom: 16,
    marginLeft: "auto",
  },
  alsoInRow: {
    display: "flex", alignItems: "center", gap: 6,
    flexWrap: "wrap" as const, marginTop: 4,
  },
  alsoInLabel: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--ink-light)",
  },
  alsoInTag: {
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    color: "var(--forest)", background: "var(--leaf)",
    padding: "1px 8px", borderRadius: 10,
    border: "1px solid var(--leaf-border)",
  },
};
