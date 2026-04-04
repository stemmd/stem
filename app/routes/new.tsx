import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { requireUser } from "~/lib/auth.server";
import { nanoid } from "nanoid";
import { StemMark } from "~/components/StemMark";
import { VisibilityPicker, ContributionPicker, CategoryPicker, CATEGORIES } from "~/components/StemPickers";
import { checkContent } from "~/lib/moderation";

export const meta: MetaFunction = () => [
  { title: "Start a stem — Stem" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  const form = await request.formData();
  const title = (form.get("title") as string || "").trim();
  const description = (form.get("description") as string || "").trim() || null;
  const visibility = (form.get("visibility") as string) || "public";
  const validVis = ["public", "mutuals", "private"];
  const finalVisibility = validVis.includes(visibility) ? visibility : "public";
  const isPublic = finalVisibility === "public" ? 1 : 0;
  const contributionMode = (form.get("contribution_mode") as string) || "open";
  const validModes = ["open", "mutuals", "closed"];
  const finalMode = validModes.includes(contributionMode) ? contributionMode : "open";
  const rawEmoji = (form.get("emoji") as string || "").trim();
  const emoji = rawEmoji ? ([...rawEmoji][0] ?? null) : null;
  const isBranch = form.get("is_branch") === "1";
  const catCount = Math.min(parseInt((form.get("category_count") as string) || "0", 10), 3);
  const categories: string[] = [];
  for (let i = 0; i < catCount; i++) {
    const id = (form.get(`category_${i}`) as string | null)?.trim();
    if (id) categories.push(id);
  }

  if (!title || title.length < 2) {
    return json({ error: "Give it a name — at least 2 characters." });
  }
  if (categories.length === 0) {
    return json({ error: "Please select at least one category." });
  }
  if (checkContent(title, description)) {
    return json({ error: "This content can't be posted. Please review our community guidelines." });
  }

  const resolvedEmoji = emoji || (CATEGORIES.find(c => c.id === categories[0])?.emoji ?? null);

  const slug = slugify(title);
  if (!slug) {
    return json({ error: "Name must contain letters or numbers." });
  }

  const db = context.cloudflare.env.DB;

  const existing = await db
    .prepare("SELECT id FROM stems WHERE user_id = ? AND slug = ?")
    .bind(user.id, slug)
    .first();

  const finalSlug = existing ? `${slug}-${nanoid(4).toLowerCase()}` : slug;
  const stemId = `stm_${nanoid(10)}`;

  await db
    .prepare(
      "INSERT INTO stems (id, user_id, slug, title, description, status, is_public, is_branch, visibility, contribution_mode, emoji) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)"
    )
    .bind(stemId, user.id, finalSlug, title, description, isPublic, isBranch ? 1 : 0, finalVisibility, finalMode, resolvedEmoji)
    .run();

  for (const catId of categories) {
    await db
      .prepare("INSERT OR IGNORE INTO stem_categories (stem_id, category_id) VALUES (?, ?)")
      .bind(stemId, catId)
      .run();
  }

  if (isBranch) {
    const memberCount = parseInt((form.get("member_count") as string) || "0", 10);
    const usernames: string[] = [];
    for (let i = 0; i < Math.min(memberCount, 20); i++) {
      const username = ((form.get(`member_${i}`) as string) || "").trim().toLowerCase();
      if (username) usernames.push(username);
    }
    if (usernames.length > 0) {
      const placeholders = usernames.map(() => "?").join(",");
      const { results: members } = await db
        .prepare(`SELECT id, username FROM users WHERE username IN (${placeholders})`)
        .bind(...usernames)
        .all<{ id: string; username: string }>();
      await Promise.all(
        members
          .filter((m) => m.id !== user.id)
          .map((m) =>
            db.prepare("INSERT OR IGNORE INTO branch_members (branch_id, user_id, invited_by) VALUES (?, ?, ?)")
              .bind(stemId, m.id, user.id).run()
          )
      );
    }
  }

  throw redirect(`/${user.username}/${finalSlug}`);
}

export default function New() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [title, setTitle] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [contributionMode, setContributionMode] = useState("open");
  const [categories, setCategories] = useState<string[]>([]);
  const [emoji, setEmoji] = useState("");
  const [isBranch, setIsBranch] = useState(false);
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const addMember = () => {
    const username = memberInput.trim().toLowerCase();
    if (!username || members.includes(username)) return;
    setMembers((prev) => [...prev, username]);
    setMemberInput("");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ marginBottom: 32 }}><StemMark /></div>
        <Form method="post" style={styles.form}>

          <div style={styles.inputGroup}>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you currently obsessed with?"
              autoFocus
              maxLength={100}
              style={styles.bigInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <p style={styles.hint}>Give it a name. Start exploring.</p>
          </div>

          {actionData?.error && (
            <p style={styles.error}>{actionData.error}</p>
          )}

          {/* Emoji */}
          <div style={styles.emojiSection}>
            <p style={styles.emojiLabel}>Emoji (optional — defaults to your first category)</p>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji([...e.target.value].slice(-1).join(""))}
              placeholder="🌱"
              style={styles.emojiInput}
              title="Type any emoji"
            />
            <input type="hidden" name="emoji" value={emoji} />
          </div>

          {!showDesc ? (
            <button
              type="button"
              onClick={() => setShowDesc(true)}
              style={styles.toggle}
            >
              + Add a description
            </button>
          ) : (
            <textarea
              name="description"
              placeholder="What's this stem about? (optional)"
              rows={3}
              style={styles.textarea}
            />
          )}

          <div style={styles.optionsSection}>
            <VisibilityPicker
              name="visibility"
              value={visibility}
              onChange={setVisibility}
            />
            <div style={styles.optionsDivider} />
            <ContributionPicker
              name="contribution_mode"
              value={contributionMode}
              onChange={setContributionMode}
            />
            <div style={styles.optionsDivider} />
            <CategoryPicker
              name="category"
              selected={categories}
              onChange={setCategories}
              max={3}
              label="Categories (up to 3)"
            />
            <div style={styles.optionsDivider} />
            <label style={styles.branchToggleRow}>
              <span style={styles.branchToggleLabel}>
                <span style={styles.branchToggleTitle}>Make this a Branch</span>
                <span style={styles.branchToggleHint}>Invite co-curators who can add finds directly</span>
              </span>
              <input
                type="hidden"
                name="is_branch"
                value={isBranch ? "1" : "0"}
              />
              <button
                type="button"
                onClick={() => setIsBranch((g) => !g)}
                style={{
                  ...styles.toggleSwitch,
                  background: isBranch ? "var(--forest)" : "var(--paper-dark)",
                }}
                aria-pressed={isBranch}
              >
                <span style={{
                  ...styles.toggleThumb,
                  transform: isBranch ? "translateX(20px)" : "translateX(2px)",
                }} />
              </button>
            </label>

            {isBranch && (
              <div style={styles.membersSection}>
                <p style={styles.membersLabel}>Invite members (optional — you can add more later)</p>
                <div style={styles.memberInputRow}>
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    placeholder="username"
                    style={styles.memberInput}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                  />
                  <button type="button" onClick={addMember} style={styles.memberAddBtn}>
                    Add
                  </button>
                </div>
                {members.map((m, i) => (
                  <div key={m} style={styles.memberChip}>
                    <input type="hidden" name={`member_${i}`} value={m} />
                    <span style={styles.memberChipText}>@{m}</span>
                    <button
                      type="button"
                      onClick={() => setMembers((prev) => prev.filter((x) => x !== m))}
                      style={styles.memberChipRemove}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input type="hidden" name="member_count" value={members.length} />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() || submitting}
            style={{
              ...styles.button,
              opacity: !title.trim() || submitting ? 0.4 : 1,
              cursor: !title.trim() || submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Creating…" : "Start stemming"}
          </button>
        </Form>
      </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--paper)",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bigInput: {
    width: "100%",
    padding: "16px 20px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 10,
    fontSize: 20,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
    color: "var(--ink)",
    outline: "none",
    resize: "none",
  },
  hint: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic",
    fontSize: 15,
    color: "var(--ink-light)",
    textAlign: "center",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--ink)",
    outline: "none",
    resize: "vertical",
  },
  toggle: {
    background: "none",
    border: "none",
    color: "var(--ink-light)",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    padding: 0,
    alignSelf: "flex-start",
  },
  button: {
    width: "100%",
    padding: "14px 24px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s",
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    color: "var(--taken)",
    textAlign: "center",
  },
  optionsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
    padding: "16px 20px",
    background: "var(--paper-mid)",
    borderRadius: 10,
    border: "1px solid var(--paper-dark)",
  },
  optionsDivider: {
    height: 1,
    background: "var(--paper-dark)",
  },
  branchToggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    cursor: "pointer",
  },
  branchToggleLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  branchToggleTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
  },
  branchToggleHint: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  toggleSwitch: {
    position: "relative" as const,
    width: 44,
    height: 24,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background 0.2s",
    padding: 0,
  },
  toggleThumb: {
    position: "absolute" as const,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
    display: "block",
  },
  membersSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: "12px 0 4px",
  },
  membersLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
  },
  memberInputRow: {
    display: "flex",
    gap: 8,
  },
  memberInput: {
    flex: 1,
    padding: "8px 12px",
    background: "var(--surface)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    color: "var(--ink)",
    outline: "none",
  },
  memberAddBtn: {
    padding: "8px 16px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: "pointer",
  },
  memberChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    background: "var(--leaf)",
    borderRadius: 20,
    border: "1px solid var(--leaf-border)",
    alignSelf: "flex-start" as const,
  },
  memberChipText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--forest)",
  },
  memberChipRemove: {
    background: "none",
    border: "none",
    padding: "0 2px",
    fontSize: 16,
    lineHeight: 1,
    color: "var(--forest)",
    cursor: "pointer",
    opacity: 0.7,
  },
  emojiSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  emojiLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
  },
  emojiInput: {
    width: 64,
    height: 48,
    borderRadius: 8,
    border: "1.5px solid var(--paper-dark)",
    background: "var(--paper-mid)",
    fontSize: 28,
    textAlign: "center" as const,
    outline: "none",
    padding: 0,
    fontFamily: "sans-serif",
    color: "var(--ink)",
  },
};
