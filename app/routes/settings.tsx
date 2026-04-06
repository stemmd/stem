import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useFetcher, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { requireUser } from "~/lib/auth.server";
import { isHttpUrl } from "~/lib/utils";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { CategoryPicker, CATEGORIES } from "~/components/StemPickers";
import { checkContent } from "~/lib/moderation";
import { validateUsername } from "~/lib/username";

export const meta: MetaFunction = () => [{ title: "Settings — Stem" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await requireUser(request, context);
  const db = context.cloudflare.env.DB;
  const [interestsResult, blockedUsersResult] = await Promise.all([
    db
      .prepare("SELECT category_id FROM user_interests WHERE user_id = ?")
      .bind(user.id)
      .all<{ category_id: string }>(),
    db
      .prepare(
        "SELECT ub.id, ub.blocked_user_id, u.username, u.display_name FROM user_blocks ub JOIN users u ON u.id = ub.blocked_user_id WHERE ub.user_id = ?"
      )
      .bind(user.id)
      .all<{ id: string; blocked_user_id: string; username: string; display_name: string | null }>(),
  ]);
  return json({
    user,
    interests: interestsResult.results.map((r) => r.category_id),
    blockedUsers: blockedUsersResult.results,
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const form = await request.formData();
  const intent = form.get("intent");
  const db = context.cloudflare.env.DB;

  if (intent === "update_profile") {
    const display_name = (form.get("display_name") as string || "").trim() || null;
    const bio = (form.get("bio") as string || "").trim() || null;
    const website = (form.get("website") as string || "").trim() || null;
    const twitter = (form.get("twitter") as string || "").trim().replace(/^@/, "") || null;

    if (display_name && display_name.length > 60)
      return json({ error: "Display name is too long (max 60 characters)." });
    if (bio && bio.length > 300)
      return json({ error: "Bio is too long (max 300 characters)." });
    if (website && !isHttpUrl(website))
      return json({ error: "Website must start with https://." });
    if (checkContent(display_name, bio))
      return json({ error: "This content can't be posted. Please review our community guidelines." });

    await db
      .prepare("UPDATE users SET display_name=?, bio=?, website=?, twitter=? WHERE id=?")
      .bind(display_name, bio, website, twitter, user.id)
      .run();
    return json({ success: "Profile updated." });
  }

  if (intent === "update_username") {
    const newUsername = (form.get("username") as string || "").trim().toLowerCase();

    const usernameCheck = validateUsername(newUsername);
    if (!usernameCheck.valid)
      return json({ usernameError: usernameCheck.reason });

    if (newUsername !== user.username) {
      if (user.username_changed_at) {
        const daysSince = (Date.now() - new Date(user.username_changed_at + "Z").getTime()) / 86_400_000;
        if (daysSince < 60) {
          return json({ usernameError: `You can change your username again in ${Math.ceil(60 - daysSince)} days.` });
        }
      }
      const existing = await db.prepare("SELECT id FROM users WHERE username = ? AND id != ?")
        .bind(newUsername, user.id).first();
      if (existing) return json({ usernameError: "That username is already taken." });

      await db.prepare("UPDATE users SET username=?, username_changed_at=datetime('now') WHERE id=?")
        .bind(newUsername, user.id).run();
    }
    return json({ usernameSuccess: "Username updated." });
  }

  if (intent === "export_data") {
    const [stemsResult, artifactsResult] = await Promise.all([
      db.prepare("SELECT id, title, slug, description FROM stems WHERE user_id=? ORDER BY updated_at DESC")
        .bind(user.id).all<{ id: string; title: string; slug: string; description: string | null }>(),
      db.prepare(`
        SELECT f.title, f.url, f.note, f.stem_id
        FROM artifacts f
        WHERE f.stem_id IN (SELECT id FROM stems WHERE user_id=?) AND f.status='approved'
        ORDER BY f.stem_id, f.created_at
      `).bind(user.id).all<{ title: string | null; url: string; note: string | null; stem_id: string }>(),
    ]);

    const artifactsByStem = new Map<string, typeof artifactsResult.results>();
    for (const f of artifactsResult.results) {
      if (!artifactsByStem.has(f.stem_id)) artifactsByStem.set(f.stem_id, []);
      artifactsByStem.get(f.stem_id)!.push(f);
    }

    const lines = [`# My stems on Stem\n`, `Exported by @${user.username}\n\n---\n`];
    for (const stem of stemsResult.results) {
      lines.push(`\n## ${stem.title}`);
      if (stem.description) lines.push(`\n${stem.description}`);
      lines.push("");
      for (const f of artifactsByStem.get(stem.id) ?? []) {
        lines.push(`- [${f.title || f.url}](${f.url})${f.note ? ` — ${f.note}` : ""}`);
      }
    }

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="stem-export-${user.username}.md"`,
      },
    });
  }

  if (intent === "delete_account") {
    const confirmed = (form.get("confirm_username") as string || "").trim();
    if (confirmed !== user.username)
      return json({ deleteError: "Username doesn't match." });

    // Delete dependent data first, then user
    await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id).run();
    await Promise.all([
      db.prepare("DELETE FROM artifacts WHERE stem_id IN (SELECT id FROM stems WHERE user_id=?)").bind(user.id).run(),
      db.prepare("DELETE FROM artifacts WHERE added_by=?").bind(user.id).run(),
      db.prepare("DELETE FROM stem_follows WHERE follower_id=? OR stem_id IN (SELECT id FROM stems WHERE user_id=?)").bind(user.id, user.id).run(),
      db.prepare("DELETE FROM stem_categories WHERE stem_id IN (SELECT id FROM stems WHERE user_id=?)").bind(user.id).run(),
      db.prepare("DELETE FROM branch_members WHERE user_id=? OR branch_id IN (SELECT id FROM stems WHERE user_id=?)").bind(user.id, user.id).run(),
      db.prepare("DELETE FROM user_follows WHERE follower_id=? OR following_id=?").bind(user.id, user.id).run(),
      db.prepare("DELETE FROM user_interests WHERE user_id=?").bind(user.id).run(),
    ]);
    await db.prepare("DELETE FROM stems WHERE user_id=?").bind(user.id).run();
    await db.prepare("DELETE FROM users WHERE id=?").bind(user.id).run();

    return redirect("/", {
      headers: { "Set-Cookie": "stem_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" },
    });
  }

  if (intent === "update_interests") {
    const catCount = Math.min(parseInt((form.get("category_count") as string) || "0", 10), CATEGORIES.length);
    const newCats: string[] = [];
    for (let i = 0; i < catCount; i++) {
      const id = (form.get(`category_${i}`) as string | null)?.trim();
      if (id) newCats.push(id);
    }
    await db.prepare("DELETE FROM user_interests WHERE user_id = ?").bind(user.id).run();
    for (const catId of newCats) {
      await db.prepare("INSERT OR IGNORE INTO user_interests (user_id, category_id) VALUES (?, ?)")
        .bind(user.id, catId).run();
    }
    return json({ interestsSuccess: "Interests updated." });
  }

  return json({ error: "Unknown action." });
}

// ── Client-side image processing ──────────────────────────────────────────────

async function processImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const tryBlob = (type: string) =>
    new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), type, 0.85)
    );

  // WebP with JPEG as fallback (for any browser that doesn't support WebP encoding)
  return tryBlob("image/webp").catch(() => tryBlob("image/jpeg"));
}

// ── Avatar uploader ────────────────────────────────────────────────────────────

function AvatarUploader({
  displayName,
  username,
  avatarUrl,
  onUpload,
}: {
  displayName: string | null;
  username: string;
  avatarUrl: string;
  onUpload: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl || null);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fetcher = useFetcher<{ url?: string; error?: string }>();

  const uploading = processing || fetcher.state !== "idle";
  const initials = (displayName || username).slice(0, 2).toUpperCase();

  // Revoke blob URL when preview moves on (avoids memory leaks)
  useEffect(() => {
    const current = preview;
    return () => { if (current?.startsWith("blob:")) URL.revokeObjectURL(current); };
  }, [preview]);

  // Respond to completed upload
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.url) {
      setPreview(fetcher.data.url);
      onUpload(fetcher.data.url);
      setUploadError(null);
    } else if (fetcher.data.error) {
      setUploadError(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, onUpload]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-selected
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Please choose a file under 10 MB.");
      return;
    }

    setUploadError(null);
    // Show raw preview immediately so the UI feels instant
    const rawUrl = URL.createObjectURL(file);
    setPreview(rawUrl);
    setProcessing(true);

    try {
      const blob = await processImage(file);
      // Replace raw preview with the processed one
      URL.revokeObjectURL(rawUrl);
      setPreview(URL.createObjectURL(blob));
      setProcessing(false);

      const fd = new FormData();
      fd.append("avatar", blob, "avatar.webp");
      fetcher.submit(fd, {
        method: "post",
        action: "/api/avatar",
        encType: "multipart/form-data",
      });
    } catch {
      URL.revokeObjectURL(rawUrl);
      setPreview(avatarUrl || null);
      setProcessing(false);
      setUploadError("Failed to process image. Please try another file.");
    }
  };

  return (
    <div style={avatarStyles.row}>
      {/* Circle */}
      <div
        style={avatarStyles.circle}
        onClick={() => !uploading && inputRef.current?.click()}
        title={uploading ? undefined : "Change photo"}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            style={avatarStyles.img}
            onError={() => setPreview(null)}
          />
        ) : (
          <span style={avatarStyles.initials}>{initials}</span>
        )}
        {uploading && (
          <div style={avatarStyles.overlay}>
            <span style={avatarStyles.overlayText}>
              {processing ? "…" : "↑"}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={avatarStyles.controls}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ ...styles.button, padding: "8px 16px", fontSize: 13, opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? (processing ? "Processing…" : "Uploading…") : "Change photo"}
        </button>
        <span style={styles.hint}>Max 2 MB</span>
        {uploadError && <p style={avatarStyles.error}>{uploadError}</p>}
        {!uploading && fetcher.state === "idle" && fetcher.data?.url && (
          <p style={avatarStyles.success}>Photo updated.</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />
    </div>
  );
}

const avatarStyles: Record<string, React.CSSProperties> = {
  row: { display: "flex", alignItems: "center", gap: 20, marginBottom: 24 },
  circle: {
    width: 80, height: 80, borderRadius: "50%",
    background: "var(--paper-dark)", overflow: "hidden",
    flexShrink: 0, cursor: "pointer", position: "relative" as const,
  },
  img: { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  initials: {
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--ink-mid)",
  },
  overlay: {
    position: "absolute" as const, inset: 0,
    background: "rgba(0,0,0,0.45)", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
  overlayText: {
    color: "#fff", fontSize: 18,
    fontFamily: "'DM Mono', monospace", fontWeight: 400,
  },
  controls: { display: "flex", flexDirection: "column" as const, gap: 6 },
  error: { fontSize: 12, color: "var(--taken)", fontFamily: "'DM Mono', monospace", margin: 0 },
  success: { fontSize: 12, color: "var(--forest)", fontFamily: "'DM Mono', monospace", margin: 0 },
};

// ─────────────────────────────────────────────────────────────────────────────

function PushToggle() {
  const [status, setStatus] = useState<"loading" | "unsupported" | "denied" | "off" | "on">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? "on" : "off");
      });
    });
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (status === "on") {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("https://api.stem.md/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setStatus("off");
      } else {
        // Subscribe
        const keyRes = await fetch("https://api.stem.md/push/vapid-key");
        const { key } = await keyRes.json<{ key: string | null }>();
        if (!key) { setStatus("unsupported"); return; }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
        });

        const json = sub.toJSON();
        await fetch("https://api.stem.md/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: json.keys,
          }),
        });
        setStatus("on");
      }
    } catch {
      // Permission denied or error
      if (Notification.permission === "denied") setStatus("denied");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;

  if (status === "unsupported") {
    return (
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--ink-light)" }}>
        Push notifications are not supported on this browser. Try adding Stem to your home screen on iOS or using Chrome.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--ink-light)" }}>
        Notification permission was denied. You can re-enable it in your browser settings.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          Push notifications
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--ink-light)", marginTop: 2 }}>
          {status === "on" ? "You'll be notified about new followers, artifacts, and more." : "Get notified when someone follows you or adds to your stems."}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        style={{
          position: "relative" as const,
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          cursor: busy ? "wait" : "pointer",
          flexShrink: 0,
          transition: "background 0.2s",
          padding: 0,
          background: status === "on" ? "var(--forest)" : "var(--paper-dark)",
        }}
        aria-pressed={status === "on"}
      >
        <span style={{
          position: "absolute" as const,
          top: 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "transform 0.2s",
          display: "block",
          transform: status === "on" ? "translateX(22px)" : "translateX(2px)",
        }} />
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function BlockedUserRow({ blockedUser }: { blockedUser: { id: string; blocked_user_id: string; username: string; display_name: string | null } }) {
  const fetcher = useFetcher();
  const isUnblocking = fetcher.state !== "idle";
  if (fetcher.data && (fetcher.data as { success?: boolean }).success) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <Link to={`/${blockedUser.username}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)", textDecoration: "none" }}>
          {blockedUser.display_name || blockedUser.username}
        </Link>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--ink-light)", marginTop: 2 }}>
          @{blockedUser.username}
        </p>
      </div>
      <fetcher.Form method="post" action="/api/block">
        <input type="hidden" name="intent" value="unblock" />
        <input type="hidden" name="blocked_user_id" value={blockedUser.blocked_user_id} />
        <button
          type="submit"
          disabled={isUnblocking}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid var(--paper-dark)",
            borderRadius: 8,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "var(--ink-mid)",
            cursor: isUnblocking ? "wait" : "pointer",
            opacity: isUnblocking ? 0.6 : 1,
          }}
        >
          {isUnblocking ? "Unblocking..." : "Unblock"}
        </button>
      </fetcher.Form>
    </div>
  );
}

export default function Settings() {
  const { user, interests, blockedUsers } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const linkedGoogle = searchParams.get("linked") === "google";
  const linkedApple = searchParams.get("linked") === "apple";
  const connectError = searchParams.get("error");
  const usernameFetcher = useFetcher<{ usernameSuccess?: string; usernameError?: string }>();
  const profileFetcher = useFetcher<{ success?: string; error?: string }>();
  const interestsFetcher = useFetcher<{ interestsSuccess?: string }>();
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(interests);
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    const stored = localStorage.getItem("stem-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function changeTheme(val: "system" | "light" | "dark") {
    setTheme(val);
    if (val === "system") {
      localStorage.setItem("stem-theme", "system");
      delete document.documentElement.dataset.theme;
    } else {
      localStorage.setItem("stem-theme", val);
      document.documentElement.dataset.theme = val;
    }
  }

  const usernameData = usernameFetcher.data;
  const profileData = profileFetcher.data;

  return (
    <div style={styles.page}>
      <Nav user={user} />
      <main style={styles.main}>
        <h1 style={styles.heading}>Settings</h1>

        {/* Profile */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>Profile</h2>

          <AvatarUploader
            displayName={user.display_name}
            username={user.username}
            avatarUrl={avatarUrl}
            onUpload={setAvatarUrl}
          />

          <profileFetcher.Form method="post" style={styles.form}>
            <input type="hidden" name="intent" value="update_profile" />

            <label style={styles.label}>
              Display name
              <input name="display_name" defaultValue={user.display_name ?? ""} placeholder="Your name" style={styles.input} />
            </label>

            <label style={styles.label}>
              Bio
              <textarea name="bio" defaultValue={user.bio ?? ""} placeholder="A little about you" rows={3} style={{ ...styles.input, resize: "vertical" as const }} />
            </label>

            <label style={styles.label}>
              Website
              <input name="website" defaultValue={user.website ?? ""} placeholder="https://yoursite.com" type="url" style={styles.input} />
            </label>

            <label style={styles.label}>
              Twitter / X
              <input name="twitter" defaultValue={user.twitter ?? ""} placeholder="handle (without @)" style={styles.input} />
            </label>

            {profileData?.success && <p style={styles.success}>{profileData.success}</p>}
            {profileData?.error && <p style={styles.error}>{profileData.error}</p>}

            <button type="submit" disabled={profileFetcher.state !== "idle"} style={{ ...styles.button, opacity: profileFetcher.state !== "idle" ? 0.6 : 1 }}>
              {profileFetcher.state !== "idle" ? "Saving…" : "Save profile"}
            </button>
          </profileFetcher.Form>
        </section>

        {/* Username */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Username</h2>
          <usernameFetcher.Form method="post" style={styles.form}>
            <input type="hidden" name="intent" value="update_username" />
            <label style={styles.label}>
              Username
              <input name="username" defaultValue={user.username} placeholder="your-username" style={styles.input} />
            </label>
            <p style={styles.hint}>
              {user.username_changed_at
                ? (() => {
                    const daysSince = (Date.now() - new Date(user.username_changed_at + "Z").getTime()) / 86_400_000;
                    const daysLeft = Math.ceil(60 - daysSince);
                    return daysLeft > 0
                      ? `Next change available in ${daysLeft} days.`
                      : "You can change your username.";
                  })()
                : "You can change your username once every 60 days."}
            </p>
            {usernameData?.usernameSuccess && <p style={styles.success}>{usernameData.usernameSuccess}</p>}
            {usernameData?.usernameError && <p style={styles.error}>{usernameData.usernameError}</p>}
            <button type="submit" disabled={usernameFetcher.state !== "idle"} style={{ ...styles.button, opacity: usernameFetcher.state !== "idle" ? 0.6 : 1 }}>
              {usernameFetcher.state !== "idle" ? "Saving…" : "Update username"}
            </button>
          </usernameFetcher.Form>
        </section>

        {/* Export */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Export your data</h2>
          <p style={styles.hint}>Download all your stems and artifacts as a Markdown file.</p>
          <Form method="post">
            <input type="hidden" name="intent" value="export_data" />
            <button type="submit" disabled={submitting} style={styles.button}>
              Download export
            </button>
          </Form>
        </section>

        {/* Interests */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Your interests</h2>
          <p style={styles.hint}>Used to personalize Explore recommendations.</p>
          <interestsFetcher.Form method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="intent" value="update_interests" />
            <CategoryPicker
              name="category"
              selected={selectedInterests}
              onChange={setSelectedInterests}
              max={CATEGORIES.length}
            />
            {interestsFetcher.data?.interestsSuccess && (
              <p style={{ ...styles.success, marginTop: 12 }}>{interestsFetcher.data.interestsSuccess}</p>
            )}
            <button
              type="submit"
              disabled={interestsFetcher.state !== "idle"}
              style={{ ...styles.button, marginTop: 16, opacity: interestsFetcher.state !== "idle" ? 0.6 : 1 }}
            >
              {interestsFetcher.state !== "idle" ? "Saving…" : "Save interests"}
            </button>
          </interestsFetcher.Form>
        </section>

        {/* Connected accounts */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Connected accounts</h2>
          {linkedGoogle && (
            <p style={{ ...styles.success, marginBottom: 12 }}>Google account connected successfully.</p>
          )}
          {linkedApple && (
            <p style={{ ...styles.success, marginBottom: 12 }}>Apple account connected successfully.</p>
          )}
          {(connectError === "google_already_linked" || connectError === "apple_already_linked") && (
            <p style={{ ...styles.error, marginBottom: 12 }}>That account is already linked to another Stem account.</p>
          )}
          {connectError === "connect_failed" && (
            <p style={{ ...styles.error, marginBottom: 12 }}>Could not connect account. Please try again.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {/* Apple connect — hidden until app is on the App Store */}
            {user.apple_id && (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Apple</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--forest)", marginTop: 2 }}>Connected</p>
                  </div>
                  <span style={styles.connectedIcon}>✓</span>
                </div>
                <div style={{ borderTop: "1px solid var(--paper-dark)" }} />
              </>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>Google</p>
                {user.google_id ? (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--forest)", marginTop: 2 }}>Connected</p>
                ) : (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--ink-light)", marginTop: 2 }}>Sign in with Google on any device</p>
                )}
              </div>
              {user.google_id ? (
                <span style={styles.connectedIcon}>✓</span>
              ) : (
                <Link to="/auth/google/connect" style={{ ...styles.button, textDecoration: "none", padding: "6px 16px", fontSize: 13 }}>
                  Connect
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Appearance</h2>
          <div style={styles.themeRow}>
            {(["system", "light", "dark"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => changeTheme(val)}
                style={{
                  ...styles.themeBtn,
                  background: theme === val ? "var(--forest)" : "var(--paper-mid)",
                  color: theme === val ? "#fff" : "var(--ink-mid)",
                  borderColor: theme === val ? "var(--forest)" : "var(--paper-dark)",
                }}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Push notifications */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Notifications</h2>
          <PushToggle />
        </section>

        {/* Chrome Extension */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Chrome Extension</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                Save to Stem from any page
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--ink-light)", marginTop: 2 }}>
                Two clicks to save any page to your stems.
              </p>
            </div>
            <Link to="/extension" style={{ padding: "8px 16px", background: "var(--forest)", color: "#fff", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, textDecoration: "none", flexShrink: 0 }}>
              Get it
            </Link>
          </div>
        </section>

        {/* Blocked users */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={styles.sectionHeading}>Blocked users</h2>
          {blockedUsers.length === 0 ? (
            <p style={styles.hint}>You haven't blocked anyone</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {blockedUsers.map((bu) => (
                <BlockedUserRow key={bu.id} blockedUser={bu} />
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section style={{ ...styles.section, marginTop: 48 }}>
          <h2 style={{ ...styles.sectionHeading, color: "var(--taken)" }}>Danger zone</h2>
          {!showDeleteForm ? (
            <button onClick={() => setShowDeleteForm(true)} style={styles.dangerBtn}>
              Delete my account
            </button>
          ) : (
            <Form method="post" style={styles.form}>
              <input type="hidden" name="intent" value="delete_account" />
              <p style={{ ...styles.hint, color: "var(--taken)" }}>
                This permanently deletes your account, stems, and all artifacts. Type your username to confirm.
              </p>
              <input
                name="confirm_username"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={user.username}
                style={{ ...styles.input, borderColor: "var(--taken)" }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  disabled={deleteConfirm !== user.username || submitting}
                  style={{ ...styles.dangerBtn, opacity: deleteConfirm !== user.username ? 0.4 : 1 }}
                >
                  {submitting ? "Deleting…" : "Delete everything"}
                </button>
                <button type="button" onClick={() => { setShowDeleteForm(false); setDeleteConfirm(""); }} style={styles.button}>
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  main: { maxWidth: 560, margin: "0 auto", padding: "40px 24px" },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32, fontWeight: 400, color: "var(--ink)", marginBottom: 40,
  },
  section: {},
  sectionHeading: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 500, color: "var(--ink-light)",
    textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 20,
  },
  form: { display: "flex", flexDirection: "column" as const, gap: 16 },
  label: {
    display: "flex", flexDirection: "column" as const, gap: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--ink-mid)",
  },
  input: {
    padding: "10px 14px",
    background: "var(--paper-mid)", border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)", outline: "none",
  },
  hint: {
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--ink-light)", lineHeight: 1.5,
    marginBottom: 12,
  },
  button: {
    alignSelf: "flex-start",
    padding: "10px 24px",
    background: "var(--forest)", color: "#fff", border: "none",
    borderRadius: 8, fontSize: 14, fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
  success: { fontSize: 13, color: "var(--forest)", fontFamily: "'DM Mono', monospace" },
  error: { fontSize: 13, color: "var(--taken)", fontFamily: "'DM Mono', monospace" },
  themeRow: {
    display: "flex",
    gap: 8,
  },
  themeBtn: {
    padding: "8px 20px",
    border: "1.5px solid",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
  },
  connectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
  },
  connectedIcon: {
    color: "var(--forest)",
    fontWeight: 600,
  },
  connectedLabel: {
    color: "var(--forest)",
    fontWeight: 500,
  },
  dangerBtn: {
    padding: "10px 20px", background: "transparent",
    color: "var(--taken)", border: "1px solid var(--taken)",
    borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
  },
};
