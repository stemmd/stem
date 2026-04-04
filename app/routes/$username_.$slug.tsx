import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
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
  const { stem, finds } = data;
  const description = stem.description ?? `${stem.title} on Stem`;
  const url = `https://stem.md/${params.username}/${params.slug}`;
  const ogImage = finds?.[0]?.image_url ?? stem.avatar_url ?? undefined;
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

interface Find {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  note: string | null;
  quote: string | null;
  source_type: string;
  embed_url: string | null;
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

  const findsSql = `
    SELECT f.id, f.url, f.title, f.description, f.image_url, f.favicon_url,
           f.note, f.quote, f.source_type, f.embed_url, f.created_at, f.added_by,
           u.username as contributor_username
    FROM finds f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'approved'
    ORDER BY f.created_at DESC
  `;

  const pendingSql = `
    SELECT f.id, f.url, f.title, f.description, f.image_url, f.favicon_url,
           f.note, f.quote, f.source_type, f.embed_url, f.created_at, f.added_by,
           u.username as contributor_username
    FROM finds f JOIN users u ON u.id = f.added_by
    WHERE f.stem_id = ? AND f.status = 'pending'
    ORDER BY f.created_at ASC
  `;

  const [findsResult, followCountRow, followRow, pendingResult, mutualRow, branchMemberRow, branchMembersResult, stemCatsResult] = await Promise.all([
    db.prepare(findsSql).bind(stem.id).all<Find>(),
    db.prepare("SELECT COUNT(*) as c FROM stem_follows WHERE stem_id = ?").bind(stem.id).first<{ c: number }>(),
    user ? db.prepare("SELECT id FROM stem_follows WHERE follower_id = ? AND stem_id = ?").bind(user.id, stem.id).first() : Promise.resolve(null),
    isOwner
      ? db.prepare(pendingSql).bind(stem.id).all<Find>()
      : (user && !isOwner)
        ? db.prepare(`${pendingSql.replace("WHERE f.stem_id = ? AND f.status = 'pending'", "WHERE f.stem_id = ? AND f.status = 'pending' AND f.added_by = ?")}`).bind(stem.id, user!.id).all<Find>()
        : Promise.resolve({ results: [] as Find[] }),
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
    finds: findsResult.results,
    pendingFinds: isOwner ? (pendingResult.results ?? []) : [],
    myPendingFinds: (!isOwner && user) ? (pendingResult.results ?? []) : [],
    user,
    isOwner,
    isBranchMember,
    isFollowing: !!followRow,
    followCount: followCountRow?.c ?? 0,
    canContribute,
    branchMembers: branchMembersResult.results,
    stemCategories: stemCatsResult.results,
  });
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

  if (intent === "approve_find") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const findId = form.get("findId") as string;
    await db.prepare("UPDATE finds SET status = 'approved' WHERE id = ? AND stem_id = ?")
      .bind(findId, stem.id).run();
    // Notify the contributor that their find was approved
    const find = await db
      .prepare("SELECT added_by FROM finds WHERE id = ?")
      .bind(findId)
      .first<{ added_by: string }>();
    if (find) {
      await createNotification({
        db, userId: find.added_by, type: "find_approved", actorId: user.id, stemId: stem.id, findId,
      });
    }
    return json({ success: true });
  }

  if (intent === "reject_find") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const findId = form.get("findId") as string;
    await db.prepare("DELETE FROM finds WHERE id = ? AND stem_id = ?")
      .bind(findId, stem.id).run();
    return json({ success: true });
  }

  if (intent === "report_find") {
    const findId = form.get("findId") as string;
    if (!findId) return json({ error: "Missing find." }, { status: 400 });
    await db.prepare("INSERT OR IGNORE INTO reports (find_id, reported_by) VALUES (?, ?)")
      .bind(findId, user.id).run();
    return json({ reported: true });
  }

  if (intent === "add_find") {
    if (stem.visibility === "private") throw new Response("Forbidden", { status: 403 });

    const isOwner = user.id === stem.user_id;
    const isBranchMember = (!isOwner && stem.is_branch)
      ? !!(await db.prepare("SELECT 1 FROM branch_members WHERE branch_id = ? AND user_id = ?").bind(stem.id, user.id).first())
      : false;

    if (!isOwner && !isBranchMember) {
      if (stem.contribution_mode === "closed") {
        return json({ error: "This stem is not accepting suggestions." }, { status: 403 });
      }
      if (stem.contribution_mode === "mutuals") {
        const mutualRow = await db.prepare(
          "SELECT COUNT(*) as c FROM user_follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)"
        ).bind(user.id, stem.user_id, stem.user_id, user.id).first<{ c: number }>();
        if ((mutualRow?.c ?? 0) < 2) {
          return json({ error: "Only mutuals can suggest finds for this stem." }, { status: 403 });
        }
      }
    }

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
    const findType = (form.get("find_type") as string | null)?.trim() || null;

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
        source_type: (findType as OGData["source_type"]) ?? (ogSourceType as OGData["source_type"]) ?? "article",
        embed_url: ogEmbedUrl,
      };
    } else {
      og = await fetchOG(url);
      // Allow user-supplied type to override the auto-detected one
      if (findType) og = { ...og, source_type: findType as OGData["source_type"] };
    }

    const findStatus = (isOwner || isBranchMember) ? "approved" : "pending";
    const findId = `fnd_${nanoid(10)}`;
    await db
      .prepare(`
        INSERT INTO finds (id, stem_id, added_by, url, title, description, image_url, favicon_url, note, quote, source_type, embed_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(findId, stem.id, user.id, url, og.title, og.description, og.image, og.favicon, note, quote, og.source_type, og.embed_url, findStatus)
      .run();

    if (findStatus === "approved") {
      await db
        .prepare("UPDATE stems SET updated_at = datetime('now') WHERE id = ?")
        .bind(stem.id)
        .run();
    }

    // Notify stem owner about new find (both pending and approved from others)
    await createNotification({
      db, userId: stem.user_id, type: "new_find", actorId: user.id, stemId: stem.id, findId,
    });

    return json({ success: true, findId, pending: findStatus === "pending" });
  }

  if (intent === "delete_find") {
    const findId = form.get("findId") as string;
    const find = await db
      .prepare("SELECT id, stem_id, added_by FROM finds WHERE id = ?")
      .bind(findId)
      .first<{ id: string; stem_id: string; added_by: string }>();

    if (!find || find.stem_id !== stem.id) {
      return json({ error: "Not found." }, { status: 404 });
    }
    if (find.added_by !== user.id && user.id !== stem.user_id) {
      return json({ error: "Forbidden." }, { status: 403 });
    }

    await db.prepare("DELETE FROM finds WHERE id = ?").bind(findId).run();
    return json({ success: true });
  }

  if (intent === "edit_find") {
    const findId = form.get("findId") as string;
    const find = await db
      .prepare("SELECT id, stem_id, added_by FROM finds WHERE id = ?")
      .bind(findId)
      .first<{ id: string; stem_id: string; added_by: string }>();

    if (!find || find.stem_id !== stem.id) {
      return json({ error: "Not found." }, { status: 404 });
    }
    if (find.added_by !== user.id && user.id !== stem.user_id) {
      return json({ error: "Forbidden." }, { status: 403 });
    }

    const newNote = (form.get("note") as string | null)?.trim() || null;
    const newQuote = (form.get("quote") as string | null)?.trim() || null;
    const newType = (form.get("find_type") as string | null)?.trim() || null;
    const VALID_TYPES = ["article","book","paper","podcast","video","tool","person","place","concept","wikipedia","youtube","arxiv"];
    const finalType = newType && VALID_TYPES.includes(newType) ? newType : null;

    await db
      .prepare("UPDATE finds SET note=?, quote=?" + (finalType ? ", source_type=?" : "") + " WHERE id=?")
      .bind(...(finalType ? [newNote, newQuote, finalType, findId] : [newNote, newQuote, findId]))
      .run();

    return json({ success: true });
  }

  if (intent === "delete_stem") {
    if (user.id !== stem.user_id) throw new Response("Forbidden", { status: 403 });
    const confirmed = (form.get("confirm_title") as string | null)?.trim();
    const stemTitle = await db.prepare("SELECT title FROM stems WHERE id = ?").bind(stem.id).first<{ title: string }>();
    if (!stemTitle || confirmed !== stemTitle.title) {
      return json({ deleteError: "Title doesn't match." });
    }
    await Promise.all([
      db.prepare("DELETE FROM finds WHERE stem_id = ?").bind(stem.id).run(),
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
  const { stem, finds, pendingFinds, myPendingFinds, user, isOwner, isBranchMember, isFollowing, followCount, canContribute, branchMembers, stemCategories } =
    useLoaderData<typeof loader>();

  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

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
    numberOfItems: finds.length,
    itemListElement: finds.slice(0, 50).map((f, i) => ({
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
              <OwnerActions stem={stem} finds={finds} />
            ) : (
              <VisitorActions
                stemId={stem.id}
                stem={stem}
                isFollowing={isFollowing}
                user={user}
                finds={finds}
              />
            )}
            <StemFollowers stemId={stem.id} count={followCount} />
          </div>
        </div>

        {canContribute && (
          <AddFindForm
            stemId={stem.id}
            isOwner={isOwner}
            stemUsername={stem.username}
            contributionMode={stem.contribution_mode}
          />
        )}
        {!canContribute && !isOwner && user && stem.contribution_mode === "mutuals" && !isBranchMember && (
          <p style={styles.closedNote}>
            Only mutuals of @{stem.username} can suggest finds here.
          </p>
        )}

        {myPendingFinds.length > 0 && (
          <div style={styles.myPendingSection}>
            <p style={styles.myPendingLabel}>Your pending suggestion{myPendingFinds.length > 1 ? "s" : ""}</p>
            {myPendingFinds.map((find) => (
              <div key={find.id} style={styles.pendingCard}>
                <span style={styles.pendingBadge}>Pending approval</span>
                <a href={find.url} target="_blank" rel="noopener noreferrer" style={styles.pendingTitle}>
                  {find.title || find.url}
                </a>
              </div>
            ))}
          </div>
        )}

        <div style={styles.findsList}>
          {finds.length === 0 ? (
            <p style={styles.empty}>
              {isOwner
                ? "Paste a URL above to add your first find."
                : "No finds yet."}
            </p>
          ) : (
            finds.map((find) => (
              <FindCard
                key={find.id}
                find={find}
                stemUserId={stem.user_id}
                currentUserId={user?.id}
                stemUsername={stem.username}
              />
            ))
          )}
        </div>

        {isOwner && pendingFinds.length > 0 && (
          <PendingSuggestions finds={pendingFinds} stemId={stem.id} />
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

function OwnerActions({ stem, finds }: { stem: Stem; finds: Find[] }) {
  return (
    <>
      <ShareButton stem={stem} />
      <ExportButton stem={stem} finds={finds} />
    </>
  );
}

// ── Visitor actions bar ───────────────────────────────────────────────────────

function VisitorActions({
  stemId,
  stem,
  isFollowing,
  user,
  finds,
}: {
  stemId: string;
  stem: Stem;
  isFollowing: boolean;
  user: { id: string } | null;
  finds: Find[];
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
        <ExportButton stem={stem} finds={finds} />
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
      <ExportButton stem={stem} finds={finds} />
    </>
  );
}

// ── Add find form ─────────────────────────────────────────────────────────────

const FIND_TYPES: { value: string; label: string; emoji: string }[] = [
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
];

function findTypeLabel(type: string): { label: string; emoji: string } {
  if (type === "youtube") return { label: "Video", emoji: "🎥" };
  if (type === "arxiv") return { label: "Paper", emoji: "🔬" };
  return FIND_TYPES.find((t) => t.value === type) ?? { label: "Article", emoji: "📄" };
}

function AddFindForm({
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
  const [findType, setFindType] = useState("");
  const [open, setOpen] = useState(isOwner);

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
      setFindType("");
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
  const effectiveType = findType || detectedType || "article";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={styles.contributeBtn}>
        {isOwner ? "Add a find" : `Suggest a find`}
        <span style={{ color: "var(--ink-light)", marginLeft: 6, fontSize: 11 }}>
          {!isOwner && contributionMode === "open" ? "· owner approves" : `by @${stemUsername}`}
        </span>
      </button>
    );
  }

  return (
    <addFetcher.Form method="post" style={styles.addFindForm}>
      <input type="hidden" name="intent" value="add_find" />
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
            {FIND_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFindType(findType === t.value ? "" : t.value)}
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
          <input type="hidden" name="find_type" value={findType || effectiveType} />

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
              {submitting ? "Adding…" : "Add find"}
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
    </addFetcher.Form>
  );
}

// ── Pending suggestions (owner) ───────────────────────────────────────────────

function PendingSuggestions({ finds, stemId }: { finds: Find[]; stemId: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={styles.pendingSection}>
      <button style={styles.pendingToggle} onClick={() => setOpen((o) => !o)}>
        <span style={styles.pendingCount}>{finds.length}</span>
        {finds.length === 1 ? " pending suggestion" : " pending suggestions"}
        <span style={{ marginLeft: 6, color: "var(--ink-light)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={styles.pendingList}>
          {finds.map((find) => (
            <PendingFindRow key={find.id} find={find} stemId={stemId} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingFindRow({ find, stemId }: { find: Find; stemId: string }) {
  const fetcher = useFetcher();
  const isActing = fetcher.state !== "idle";
  const acted = fetcher.state === "idle" && fetcher.data != null;
  if (acted) return null;

  return (
    <div style={styles.pendingRow}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={find.url} target="_blank" rel="noopener noreferrer" style={styles.pendingTitle}>
          {find.title || find.url}
        </a>
        {find.note && <p style={styles.pendingNote}>{find.note}</p>}
        <p style={styles.pendingMeta}>by @{find.contributor_username} · {getDomain(find.url)}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="approve_find" />
          <input type="hidden" name="findId" value={find.id} />
          <button type="submit" disabled={isActing} style={styles.approveBtn}>Approve</button>
        </fetcher.Form>
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="reject_find" />
          <input type="hidden" name="findId" value={find.id} />
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
            Branch members can add finds directly without approval.
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
                This permanently deletes this stem and all its finds. Type the stem title to confirm.
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

// ── Find card ─────────────────────────────────────────────────────────────────

function FindCard({
  find,
  stemUserId,
  currentUserId,
  stemUsername,
}: {
  find: Find;
  stemUserId: string;
  currentUserId: string | undefined;
  stemUsername: string;
}) {
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();
  const reportFetcher = useFetcher<{ reported?: boolean }>();
  const canEdit = currentUserId === find.added_by || currentUserId === stemUserId;
  const canReport = !!currentUserId && currentUserId !== find.added_by;
  const reported = reportFetcher.data?.reported === true;
  const isDeleting =
    deleteFetcher.state !== "idle" &&
    deleteFetcher.formData?.get("findId") === find.id;
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(find.note ?? "");
  const [editQuote, setEditQuote] = useState(find.quote ?? "");
  const [editType, setEditType] = useState(find.source_type);

  // Close edit panel after save
  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.success) {
      setEditing(false);
    }
  }, [editFetcher.state, editFetcher.data]);

  if (isDeleting) return null;

  const domain = getDomain(find.url);
  const showContributor = find.contributor_username !== stemUsername;
  const embedId = find.embed_url ? null : (find.source_type === "youtube" ? extractYouTubeId(find.url) : null);
  const embedUrl = find.embed_url || (embedId ? `https://www.youtube.com/embed/${embedId}` : null);
  const typeInfo = findTypeLabel(find.source_type);

  return (
    <div style={styles.findCard}>
      {embedUrl && (
        <iframe
          src={embedUrl}
          style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: 8, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {!embedUrl && find.image_url && (
        <img
          src={find.image_url}
          alt=""
          style={styles.findThumb}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div style={{ ...styles.findBody, flex: 1 }}>
        <a
          href={find.url}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.findTitle}
          onClick={() => track("open_link", { stem_id: find.stem_id, find_id: find.id })}
        >
          {find.title || find.url}
        </a>

        {find.note && <p style={styles.findNote}>{find.note}</p>}

        {find.quote && (
          <blockquote style={styles.findQuote}>"{find.quote}"</blockquote>
        )}

        <div style={styles.findFooter}>
          <span style={styles.findTypeBadge} title={typeInfo.label}>
            {typeInfo.emoji}
          </span>
          <span style={styles.findDomain}>
            {find.favicon_url && (
              <img src={find.favicon_url} alt="" style={{ width: 12, height: 12, flexShrink: 0 }} />
            )}
            {domain}
          </span>
          {showContributor && (
            <span style={styles.contributor}>via @{find.contributor_username}</span>
          )}
          <span style={styles.timestamp}>{formatRelative(find.created_at)}</span>
          {canReport && !canEdit && (
            reported ? (
              <span style={{ ...styles.timestamp, color: "var(--ink-light)" }}>Reported</span>
            ) : (
              <reportFetcher.Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="intent" value="report_find" />
                <input type="hidden" name="findId" value={find.id} />
                <button type="submit" style={styles.reportBtn} title="Report this find">⚑</button>
              </reportFetcher.Form>
            )
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => { setEditing((e) => !e); setEditNote(find.note ?? ""); setEditQuote(find.quote ?? ""); setEditType(find.source_type); }}
              style={{ ...styles.deleteBtn, marginLeft: "auto" }}
              title="Edit find"
            >
              ✏
            </button>
          )}
          {canEdit && (
            <deleteFetcher.Form method="post">
              <input type="hidden" name="intent" value="delete_find" />
              <input type="hidden" name="findId" value={find.id} />
              <button type="submit" style={styles.deleteBtn} title="Remove find">×</button>
            </deleteFetcher.Form>
          )}
        </div>

        {editing && (
          <editFetcher.Form method="post" style={styles.editForm}>
            <input type="hidden" name="intent" value="edit_find" />
            <input type="hidden" name="findId" value={find.id} />
            <div style={styles.typePickerRow}>
              {FIND_TYPES.map((t) => (
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
            <input type="hidden" name="find_type" value={editType} />
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
      </div>
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

function ExportButton({ stem, finds }: { stem: Stem; finds: Find[] }) {
  const handleExport = () => {
    const lines = [
      `# ${stem.title}`,
      "",
      stem.description ? `${stem.description}\n` : "",
      `**Curator:** @${stem.username}`,
      "",
      "---",
      "",
      ...finds.map(
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

  // Add find form
  contributeBtn: {
    display: "block", width: "100%", padding: "12px 20px",
    background: "transparent", border: "1.5px dashed var(--paper-dark)",
    borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    color: "var(--ink-mid)", cursor: "pointer", marginBottom: 32, textAlign: "center" as const,
  },
  addFindForm: {
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

  // Find list
  findsList: { display: "flex", flexDirection: "column" as const, gap: 12 },
  findCard: {
    display: "flex", flexDirection: "column" as const, gap: 10, padding: 16,
    background: "var(--surface)", border: "1px solid var(--paper-dark)", borderRadius: 12,
    animation: "fadeUp 0.2s ease",
  },
  findThumb: {
    width: 48, height: 48, borderRadius: 6,
    objectFit: "cover" as const, flexShrink: 0,
  },
  findBody: {
    display: "flex", flexDirection: "column" as const, gap: 4, minWidth: 0,
  },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 15,
    color: "var(--ink)", textDecoration: "none",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
    display: "block",
  },
  findNote: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    color: "var(--ink-mid)", fontStyle: "italic" as const,
  },
  findFooter: {
    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 2,
  },
  findDomain: {
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

  // My pending finds (non-owner)
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
  findTypeBadge: {
    fontSize: 13, flexShrink: 0,
  },
  findQuote: {
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
};
