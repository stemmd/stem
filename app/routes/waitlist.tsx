import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { useRef, useState } from "react";
import { getUser } from "~/lib/auth.server";
import { API_BASE } from "~/lib/config";
import { StemMark } from "~/components/StemMark";
import { validateUsername } from "~/lib/username";

export const meta: MetaFunction = () => [{ title: "Join the waitlist — Stem" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getUser(request, context);
  if (user) throw redirect("/feed");

  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const name = url.searchParams.get("name") || "";

  // Check if this email is already on the waitlist
  let waitlistStatus: "not_on_list" | "pending" | "invited" = "not_on_list";
  let reservedUsername: string | null = null;

  if (email) {
    const db = context.cloudflare.env.DB;
    const entry = await db
      .prepare("SELECT username, invited_at FROM waitlist WHERE email = ?")
      .bind(email.toLowerCase())
      .first<{ username: string; invited_at: string | null }>();

    if (entry) {
      reservedUsername = entry.username;
      waitlistStatus = entry.invited_at ? "invited" : "pending";
    }
  }

  return json({ email, name, waitlistStatus, reservedUsername });
}

export default function Waitlist() {
  const { email, name, waitlistStatus, reservedUsername } = useLoaderData<typeof loader>();
  const [username, setUsername] = useState("");
  const [checkState, setCheckState] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(waitlistStatus !== "not_on_list");
  const [displayUsername, setDisplayUsername] = useState(reservedUsername || "");
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentRef = useRef("");

  const checkUsername = async (val: string) => {
    const check = validateUsername(val);
    if (!check.valid) { setCheckState("invalid"); return; }
    setCheckState("checking");
    try {
      const res = await fetch(`${API_BASE}/check?username=${encodeURIComponent(val)}`);
      const data = await res.json<{ available: boolean }>();
      if (val !== currentRef.current) return;
      setCheckState(data.available ? "available" : "taken");
    } catch {
      setCheckState("idle");
    }
  };

  const handleUsernameChange = (val: string) => {
    const lower = val.toLowerCase();
    setUsername(lower);
    currentRef.current = lower;
    setCheckState("idle");
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!lower) return;
    debounceRef.current = setTimeout(() => checkUsername(lower), 400);
  };

  const handleSubmit = async () => {
    if (checkState !== "available" || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: email.toLowerCase(),
          turnstile: (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value || "",
        }),
      });
      const data = await res.json<{ success?: boolean; error?: string }>();
      if (res.ok && data.success) {
        setSubmitted(true);
        setDisplayUsername(username);
      } else {
        if (data.error === "username_taken") {
          setCheckState("taken");
        } else if (data.error === "captcha_failed") {
          setError("Verification failed. Please wait a moment and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = {
    idle: "transparent",
    checking: "var(--ink-light)",
    available: "var(--forest)",
    taken: "var(--taken)",
    invalid: "var(--ink-light)",
  }[checkState];

  const statusMsg = {
    idle: "",
    checking: "checking...",
    available: `stem.md/${username} is yours`,
    taken: "already claimed",
    invalid: "letters, numbers, and hyphens only",
  }[checkState];

  // Already on waitlist or just submitted
  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <StemMark />
          {waitlistStatus === "invited" ? (
            <>
              <h1 style={styles.heading}>You're in.</h1>
              <p style={styles.body}>
                stem.md/<strong style={{ color: "var(--forest)" }}>{displayUsername}</strong> is ready for you.
              </p>
              <Link to="/signin" style={styles.primaryBtn}>Sign in</Link>
            </>
          ) : (
            <>
              <h1 style={styles.heading}>Your curiosity will be rewarded.</h1>
              <p style={styles.body}>
                stem.md/<strong style={{ color: "var(--forest)" }}>{displayUsername}</strong> is waiting for you.
              </p>
              <p style={styles.subtext}>
                We're letting people in gradually. You'll hear from us soon.
              </p>
              <Link to="/" style={styles.homeLink}>Back to stem.md</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // New visitor, needs to reserve username
  return (
    <div style={styles.page}>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div style={styles.card}>
        <StemMark />
        <h1 style={styles.heading}>Stem is invite-only.</h1>
        <p style={styles.body}>
          We're in beta right now. Reserve your username and we'll let you in soon.
        </p>

        {name && (
          <p style={styles.greeting}>
            Hey {name.split(" ")[0]}, glad you're curious.
          </p>
        )}

        <div style={styles.form}>
          <div style={styles.usernameRow}>
            <span style={styles.prefix}>stem.md/</span>
            <input
              style={styles.input}
              type="text"
              placeholder="yourname"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={20}
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
            />
          </div>

          <p style={{ ...styles.status, color: statusColor }}>{statusMsg || "\u00A0"}</p>

          {error && <p style={styles.error}>{error}</p>}

          <div className="cf-turnstile" data-sitekey="0x4AAAAAACzDdtqFQgWP_8FO" data-theme="auto" data-size="normal" style={{ marginTop: 8 }} />

          <button
            style={{
              ...styles.primaryBtn,
              opacity: checkState !== "available" || submitting ? 0.5 : 1,
              cursor: checkState !== "available" || submitting ? "not-allowed" : "pointer",
            }}
            disabled={checkState !== "available" || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Reserving..." : "Reserve my username"}
          </button>
        </div>

        <p style={styles.footnote}>
          Already have an account?{" "}
          <Link to="/signin" style={styles.signinLink}>Sign in</Link>
        </p>
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
    padding: 24,
    background: "var(--paper)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 400,
    color: "var(--ink)",
    marginTop: 24,
    marginBottom: 8,
  },
  body: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    lineHeight: 1.5,
    marginTop: 8,
  },
  greeting: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    fontStyle: "italic",
    marginTop: 16,
    marginBottom: 8,
  },
  form: {
    width: "100%",
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  usernameRow: {
    display: "flex",
    alignItems: "stretch",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    overflow: "hidden",
    background: "var(--paper-mid)",
  },
  prefix: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "var(--ink-mid)",
    padding: "13px 0 13px 14px",
    display: "flex",
    alignItems: "center",
    userSelect: "none",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    color: "var(--ink)",
    padding: "13px 14px 13px 2px",
    minWidth: 0,
  },
  status: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    textAlign: "left",
    minHeight: "1.2em",
  },
  error: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--taken)",
    textAlign: "left",
  },
  primaryBtn: {
    display: "block",
    width: "100%",
    padding: "13px 20px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    marginTop: 8,
  },
  homeLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--forest)",
    textDecoration: "none",
    marginTop: 24,
  },
  footnote: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 32,
  },
  signinLink: {
    color: "var(--forest)",
    textDecoration: "underline",
    textDecorationColor: "var(--paper-dark)",
  },
};
