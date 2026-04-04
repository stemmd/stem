import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getUser } from "~/lib/auth.server";
import { API_BASE } from "~/lib/config";
import { validateUsername } from "~/lib/username";

export const meta: MetaFunction = () => [
  { title: "Stem — Grow your curiosity" },
  { name: "description", content: "Stem is the place your curiosity is looking for. Find trails worth following. Leave trails worth finding." },
  { property: "og:site_name", content: "Stem" },
  { property: "og:title", content: "Stem — Grow your curiosity" },
  { property: "og:description", content: "A place to publicly explore the topics you're obsessed with — and find others going down the same rabbit holes." },
  { property: "og:image", content: "https://stem.md/og-image.png" },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@amrith" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getUser(request, context);
  if (user) throw redirect("/feed");
  return json({});
}

const LINES = [
  "For the person who has seventeen tabs open about the Byzantine Empire.",
  "For the one who sends their friends a link and a twelve-message explanation.",
  "For everyone who's ever gone too deep on something and loved it.",
  "For those who can't have lunch without watching a random YouTube video.",
  "For the person whose \"quick Google\" takes forty-five minutes.",
  "For the one who learned more from Wikipedia rabbit holes than from school.",
  "For those who've explained the same obscure thing to three different people this week.",
  "For the person who buys books faster than they finish them.",
  "For the one who pauses a movie to look something up and never comes back.",
  "For those who've said \"I'll just read one more article\" at midnight.",
  "For the person who found their favourite band through a documentary about something completely unrelated.",
  "For the one who can't walk past an interesting sign without photographing it.",
  "For those who have strong opinions about things nobody asked about.",
  "For the person who annotates everything they read.",
  "For the one who fell in love with a subject they never studied.",
  "For those who follow people online just to see what they're obsessing over next.",
  "For the person who finishes a book and immediately needs to talk about it with someone.",
  "For the one whose notes app is a graveyard of ideas they haven't forgotten.",
];

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

// ─── Mockup components ────────────────────────────────────────────────────────

function StemMockup() {
  const finds: [string, string][] = [
    ["How memory consolidation actually works", "nature.com"],
    ["The predictive coding framework", "aeon.co"],
    ["Embodied cognition: a reading list", "philpapers.org"],
    ["The Default Mode Network, explained", "sci.am"],
    ["Against Behaviorism (Chomsky, 1959)", "mit.edu"],
  ];
  return (
    <div style={mock.wrap}>
      <div style={mock.stemTop}>
        <span style={mock.bigEmoji}>🧠</span>
        <div>
          <p style={mock.stemTitle}>Cognitive science</p>
          <p style={mock.stemMeta}>@amrith · 14 finds · public</p>
        </div>
      </div>
      <div style={mock.rule} />
      <div style={mock.findList}>
        {finds.map(([title, domain]) => (
          <div key={title} style={mock.findRow}>
            <span style={mock.findTitle}>{title}</span>
            <span style={mock.findDomain}>{domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedMockup() {
  const groups: Array<{ emoji: string; stem: string; user: string; ago: string; finds: [string, string][] }> = [
    {
      emoji: "🎵",
      stem: "Jazz lineage",
      user: "@jamie",
      ago: "2h ago",
      finds: [
        ["Miles Davis and the Birth of Cool", "npr.org"],
        ["The Anatomy of a Jazz Standard", "jstor.org"],
      ],
    },
    {
      emoji: "🏛️",
      stem: "Byzantine architecture",
      user: "@claudia",
      ago: "5h ago",
      finds: [
        ["The Hagia Sophia's engineering secrets", "bbc.com"],
        ["Pendentives and the dome problem", "arch.edu"],
        ["When Constantinople became Istanbul", "history.com"],
      ],
    },
  ];
  return (
    <div style={mock.wrap}>
      <p style={mock.feedHeading}>Feed</p>
      <div style={mock.rule} />
      {groups.map((g, i) => (
        <div key={g.stem} style={i > 0 ? { ...mock.feedGroup, borderTop: "1px solid var(--paper-mid)", paddingTop: 14, marginTop: 14 } : mock.feedGroup}>
          <div style={mock.feedGroupHead}>
            <span style={mock.feedEmoji}>{g.emoji}</span>
            <span style={mock.feedStem}>{g.stem}</span>
            <span style={mock.feedDot}>·</span>
            <span style={mock.feedUser}>{g.user}</span>
            <span style={mock.feedDot}>·</span>
            <span style={mock.feedTime}>{g.ago}</span>
          </div>
          <div style={mock.findList}>
            {g.finds.map(([title, domain]) => (
              <div key={title} style={mock.findRow}>
                <span style={mock.findTitle}>{title}</span>
                <span style={mock.findDomain}>{domain}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const mock: Record<string, React.CSSProperties> = {
  wrap: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 8px 48px rgba(0,0,0,0.07)",
    width: "100%",
    boxSizing: "border-box" as const,
    minWidth: 0,
  },
  stemTop: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  bigEmoji: { fontSize: 36, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  stemTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "var(--ink)",
    lineHeight: 1.2,
  },
  stemMeta: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    marginTop: 5,
  },
  rule: { height: 1, background: "var(--paper-dark)", marginBottom: 16 },
  findList: { display: "flex", flexDirection: "column" as const, gap: 10 },
  findRow: { display: "flex", alignItems: "baseline", gap: 8 },
  findTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink)",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  findDomain: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
    flexShrink: 0,
  },
  feedHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18,
    color: "var(--ink)",
    marginBottom: 16,
  },
  feedGroup: {},
  feedGroupHead: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap" as const,
    marginBottom: 10,
  },
  feedEmoji: { fontSize: 14, lineHeight: 1 },
  feedStem: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--ink)",
  },
  feedDot: { color: "var(--paper-dark)", fontSize: 11 },
  feedUser: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  feedTime: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: "var(--ink-light)",
  },
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function Home() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [inlineError, setInlineError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.dataset.theme;
    setIsDark(theme === "dark");
    setThemeReady(true);
  }, []);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUsernameRef = useRef("");

  useEffect(() => {
    let lineIndex = Math.floor(Math.random() * LINES.length);
    let charIndex = 0;
    function typeLine() {
      const line = LINES[lineIndex];
      if (charIndex < line.length) {
        charIndex++;
        setTypewriterText(line.slice(0, charIndex));
        typeRef.current = setTimeout(typeLine, 48);
      } else {
        typeRef.current = setTimeout(backspace, 3400);
      }
    }
    function backspace() {
      if (charIndex > 0) {
        charIndex--;
        setTypewriterText(LINES[lineIndex].slice(0, charIndex));
        typeRef.current = setTimeout(backspace, 22);
      } else {
        lineIndex = (lineIndex + 1) % LINES.length;
        typeRef.current = setTimeout(typeLine, 320);
      }
    }
    typeRef.current = setTimeout(typeLine, 800);
    return () => { if (typeRef.current) clearTimeout(typeRef.current); };
  }, []);

  const checkUsername = async (val: string) => {
    const check = validateUsername(val);
    if (!check.valid) { setCheckState("invalid"); return; }
    setCheckState("checking");
    try {
      const res = await fetch(`${API_BASE}/check?username=${encodeURIComponent(val)}`);
      const data = await res.json<{ available: boolean }>();
      if (val !== currentUsernameRef.current) return;
      setCheckState(data.available ? "available" : "taken");
    } catch {
      setCheckState("idle");
    }
  };

  const handleUsernameChange = (val: string) => {
    const lower = val.toLowerCase();
    setUsername(lower);
    currentUsernameRef.current = lower;
    setCheckState("idle");
    setInlineError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!lower) return;
    debounceRef.current = setTimeout(() => checkUsername(lower), 400);
  };

  const emailValid = email.includes("@") && email.includes(".");
  const canSubmit = checkState === "available" && emailValid;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setInlineError("");
    try {
      const turnstileEl = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null;
      const turnstile = turnstileEl?.value || "";
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, turnstile }),
      });
      const data = await res.json<{ success?: boolean; error?: string }>();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setSubmitting(false);
        if (data.error === "username_taken") {
          setInlineError("just taken — try another");
          setCheckState("taken");
        } else if (data.error === "email_taken") {
          setInlineError("that email's already on the list");
        } else if (data.error === "captcha_failed") {
          setInlineError("Verification failed. Please wait a moment and try again.");
        } else {
          setInlineError("something went wrong — try again");
        }
      }
    } catch {
      setSubmitting(false);
      setInlineError("something went wrong — try again");
    }
  };

  const statusMsg = {
    idle: "",
    checking: "checking",
    available: `stem.md/${username} is available`,
    taken: "already claimed",
    invalid: "letters, numbers, and hyphens only",
  }[checkState];

  const statusColor = {
    idle: "transparent",
    checking: "var(--ink-light)",
    available: "var(--forest)",
    taken: "var(--taken)",
    invalid: "var(--ink-light)",
  }[checkState];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .checking-dot::after {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          background: var(--ink-light);
          border-radius: 50%;
          margin-left: 6px; vertical-align: middle;
          animation: blink 1s ease infinite;
        }
        .username-row:focus-within { border-color: var(--forest); }
        .submit-btn:hover:not(:disabled) { background: var(--branch) !important; transform: scale(1.02); }
        .signin-btn:hover { opacity: 0.9 !important; }
        .theme-toggle:hover { color: var(--ink) !important; }
        .narr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .narr-grid-flip .narr-vis { order: -1; }
        .discord-link:hover { color: var(--branch) !important; }
        @media (max-width: 600px) {
          .landing-headline { font-size: clamp(1.7rem, 7vw, 2.2rem) !important; }
          .landing-nav { top: 20px !important; right: 20px !important; }
          .landing-logo { top: 20px !important; left: 20px !important; }
          .landing-theme-toggle { top: 26px !important; right: 100px !important; }
          .narr-section { padding-left: 24px !important; padding-right: 24px !important; }
          .narr-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .narr-grid-flip .narr-vis { order: 0 !important; }
          .narr-grid .beat-text { max-width: 100% !important; }
          .narr-vis { min-width: 0; }
          .landing-hero { padding: 100px 24px 60px !important; }
          .landing-footer { padding: 20px 24px !important; }
          .below-fold { padding: 32px 24px 60px !important; }
        }
      `}} />

      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      {/* Logo */}
      <a href="/" style={styles.logo} className="landing-logo">
        <div style={styles.logoMark}>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: "#FFFFFF" }}>
            <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <span style={styles.logoWord}>stem</span>
      </a>

      {/* Theme toggle */}
      <button
        style={{ ...styles.themeToggle, opacity: themeReady ? 1 : 0 }}
        className="theme-toggle landing-theme-toggle"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => {
          const next = isDark ? "light" : "dark";
          localStorage.setItem("stem-theme", next);
          document.documentElement.dataset.theme = next;
          setIsDark(!isDark);
        }}
      >
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M13.5 10.3A6 6 0 0 1 5.7 2.5 6.5 6.5 0 1 0 13.5 10.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <Link to="/signin" style={styles.signInBtn} className="signin-btn landing-nav">Sign in</Link>

      {/* ── Hero ── */}
      <section style={styles.hero} className="landing-hero">
        <div style={styles.heroContent}>
          <h1 className="landing-headline" style={styles.headline}>
            Find trails worth following.<br />Leave trails worth finding.
          </h1>
          <p style={styles.subline}>Stem is the place your curiosity is looking for.</p>

          <div style={styles.formWrap}>
            {success ? (
              <div style={styles.successWrap}>
                <p style={styles.successMain}>stem.md/{username} is yours.</p>
                <p style={styles.successSub}>We'll be in touch.</p>
              </div>
            ) : (
              <>
                <div className="username-row" style={styles.usernameRow}>
                  <span style={styles.usernamePrefix}>stem.md/</span>
                  <input
                    style={styles.usernameInput}
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
                <div
                  className={checkState === "checking" ? "checking-dot" : ""}
                  style={{ ...styles.usernameStatus, color: statusColor, minHeight: "1.2em" }}
                >
                  {statusMsg}
                </div>
                {checkState === "available" && (
                  <input
                    style={styles.emailInput}
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
                {inlineError && <div style={styles.inlineError}>{inlineError}</div>}
                <div className="cf-turnstile" data-sitekey="0x4AAAAAACzDdtqFQgWP_8FO" data-theme="auto" data-size="normal" style={{ marginTop: 12 }} />
                {checkState === "available" && (
                  <button
                    className="submit-btn"
                    style={{ ...styles.submitBtn, opacity: (!canSubmit || submitting) ? 0.5 : 1, cursor: (!canSubmit || submitting) ? "not-allowed" : "pointer" }}
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Reserving…" : "Reserve my stem"}
                  </button>
                )}
                <p style={styles.formNote}>Claim your trail.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Narrative ── */}
      <div style={styles.narrative} className="narr-section">

        {/* Opening */}
        <div style={styles.opening}>
          <p style={styles.beatLabel}>The curious person's problem</p>
          <h2 style={styles.openingHeading}>
            Every curious person leaves a trail.<br />
            Yours deserves to be found.
          </h2>
          <div style={styles.openingBodyWrap}>
            <p style={styles.openingBody}>
              You know the feeling. One article becomes seventeen tabs. A quick
              Google turns into an hour-long deep dive. By the end of the week
              you've learned more about something than you ever expected to.
            </p>
            <p style={styles.openingBody}>
              Everyone does this. Your friend is deep into jazz history. Your
              colleague keeps finding fascinating things about Byzantine
              architecture. Someone online just posted a thread about mycology
              that you need to share with three people.
            </p>
            <p style={styles.pullQuote}>
              Goodreads gave readers a home. Letterboxd gave film lovers one.
              Stem is where the rest of your curiosity lives.
            </p>
          </div>
        </div>

        <div style={styles.sectionRule} />

        {/* Beat 1 — Document */}
        <div className="narr-grid" style={styles.beatGrid}>
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Your stems</p>
            <h2 style={styles.beatHeading}>Share what you're exploring</h2>
            <p style={styles.beatBody}>
              Create a stem for anything you're diving into. Add the articles,
              videos, and papers that shaped your thinking. Your stems are public,
              so anyone curious about the same things can find you, follow along,
              and contribute their own finds.
            </p>
            <p style={{ ...styles.beatBody, marginTop: 16, color: "var(--ink-light)", fontStyle: "italic" as const }}>
              Public by default. Private when you need it.
            </p>
          </div>
          <div className="narr-vis">
            <StemMockup />
          </div>
        </div>

        <div style={styles.sectionRule} />

        {/* Beat 2 — Discover */}
        <div className="narr-grid narr-grid-flip" style={styles.beatGrid}>
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Your feed</p>
            <h2 style={styles.beatHeading}>Follow trails that intrigue you</h2>
            <p style={styles.beatBody}>
              Your feed shows you what the people you follow are adding to their
              stems right now. New finds from people exploring the same things as
              you. And trails you never would have found on your own.
            </p>
          </div>
          <div className="narr-vis">
            <FeedMockup />
          </div>
        </div>

        <div style={styles.sectionRule} />

        {/* Beat 3 — Community */}
        <div style={styles.communityBlock}>
          <p style={styles.beatLabel}>Community</p>
          <h2 style={styles.communityHeading}>
            Explore trails together
          </h2>
          <p style={styles.communityBody}>
            A growing Discord community of curious people sharing what they're
            exploring, swapping finds, and meeting others who care about the
            same things.
          </p>
          <a href="/discord" target="_blank" rel="noopener noreferrer" className="discord-link" style={styles.communityLink}>
            Join the community →
          </a>
        </div>

      </div>

      {/* ── Typewriter ── */}
      <section style={styles.belowFold} className="below-fold">
        <div style={styles.typewriterWrap}>
          <p style={styles.typewriterLine}>{typewriterText || "\u00A0"}</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer} className="landing-footer">
        <div style={styles.footerLinks}>
          <Link to="/terms" style={styles.footerLink}>Terms</Link>
          <span style={styles.footerDot}>·</span>
          <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
          <span style={styles.footerDot}>·</span>
          <a href="/discord" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Community</a>
        </div>
        <p style={styles.footerTagline}>
          Made with curiosity by{" "}
          <Link to="/amrith" style={styles.footerAuthor}>@amrith</Link>
        </p>
      </footer>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  logo: {
    position: "absolute",
    top: 32, left: 40,
    display: "flex", alignItems: "center", gap: 10,
    textDecoration: "none", zIndex: 10,
  },
  logoMark: {
    width: 36, height: 36,
    backgroundColor: "var(--forest)",
    borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoWord: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22, color: "var(--ink)", lineHeight: 1,
  },
  themeToggle: {
    position: "absolute" as const,
    top: 40, right: 132,
    background: "none",
    border: "none",
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
    zIndex: 10,
  },
  signInBtn: {
    position: "absolute",
    top: 36, right: 40,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 500,
    color: "#fff",
    textDecoration: "none",
    border: "none",
    borderRadius: 8,
    padding: "7px 16px",
    background: "var(--forest)",
    transition: "opacity 0.15s",
    zIndex: 10,
  },

  // Hero (untouched structure)
  hero: {
    position: "relative",
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "120px 40px 80px",
  },
  heroContent: { maxWidth: 680, width: "100%", textAlign: "center" },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(2.2rem, 5vw, 3.25rem)",
    lineHeight: 1.15,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    opacity: 0,
    animation: "fadeIn 0.6s ease forwards 0.1s",
  },
  subline: {
    marginTop: 20, fontSize: "1rem",
    color: "var(--ink-mid)", fontWeight: 400, letterSpacing: "0.01em",
  },
  formWrap: { marginTop: 44, maxWidth: 480, marginLeft: "auto", marginRight: "auto" },
  usernameRow: {
    display: "flex", alignItems: "stretch",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8, overflow: "hidden",
    background: "var(--paper-mid)", transition: "border-color 0.15s",
  },
  usernamePrefix: {
    fontFamily: "'DM Mono', monospace", fontSize: "0.875rem",
    color: "var(--ink-mid)", background: "transparent",
    padding: "13px 0 13px 14px", whiteSpace: "nowrap",
    lineHeight: 1, display: "flex", alignItems: "center", userSelect: "none",
  },
  usernameInput: {
    flex: 1, background: "transparent", border: "none", outline: "none",
    fontFamily: "'DM Mono', monospace", fontSize: "0.875rem",
    color: "var(--ink)", padding: "13px 14px 13px 2px", minWidth: 0,
  },
  usernameStatus: {
    fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
    marginTop: 8, textAlign: "left", transition: "color 0.15s",
  },
  emailInput: {
    width: "100%", background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)", borderRadius: 8, outline: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem",
    color: "var(--ink)", padding: "13px 14px", marginTop: 10,
    transition: "border-color 0.15s", display: "block",
  },
  inlineError: {
    fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
    color: "var(--taken)", marginTop: 8, textAlign: "left",
  },
  submitBtn: {
    marginTop: 14, width: "100%",
    background: "var(--forest)", color: "var(--paper)",
    border: "none", borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem",
    fontWeight: 500, padding: "14px 20px",
    transition: "background 0.15s, transform 0.1s", display: "block",
  },
  formNote: {
    fontFamily: "'DM Mono', monospace", fontSize: "0.625rem",
    color: "var(--ink-light)", marginTop: 12, textAlign: "center",
  },
  successWrap: { textAlign: "center" },
  successMain: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.5rem", color: "var(--forest)", lineHeight: 1.3,
  },
  successSub: { marginTop: 10, fontSize: "0.9375rem", color: "var(--ink-mid)" },

  // Narrative wrapper
  narrative: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "0 40px 100px",
    width: "100%",
    boxSizing: "border-box" as const,
  },

  // Opening
  opening: {
    maxWidth: 680,
    margin: "0 auto",
    paddingBottom: 0,
    textAlign: "center" as const,
    opacity: 0,
    animation: "fadeIn 0.7s ease forwards 0.3s",
  },
  openingHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
    lineHeight: 1.18,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    marginBottom: 32,
    marginTop: 12,
  },
  openingBodyWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    maxWidth: 560,
    margin: "0 auto",
  },
  openingBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    color: "var(--ink-mid)",
    lineHeight: 1.75,
    textAlign: "center" as const,
  },
  pullQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18,
    color: "var(--ink)",
    lineHeight: 1.55,
    textAlign: "center" as const,
    borderTop: "1px solid var(--paper-dark)",
    borderBottom: "1px solid var(--paper-dark)",
    padding: "20px 0",
    marginTop: 8,
  },

  // Section rule
  sectionRule: {
    width: 48,
    height: 1,
    background: "var(--paper-dark)",
    margin: "80px auto",
  },

  // Beat grid (handled by .narr-grid CSS class)
  beatGrid: {},

  // Beat text column
  beatText: {
    maxWidth: 440,
  },
  beatLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--forest)",
    marginBottom: 14,
  },
  beatHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
    lineHeight: 1.2,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    marginBottom: 20,
  },
  beatBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.75,
  },

  // Community block
  communityBlock: {
    maxWidth: 560,
    margin: "0 auto",
    textAlign: "center" as const,
  },
  communityHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
    lineHeight: 1.2,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    marginBottom: 16,
    marginTop: 12,
  },
  communityBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.75,
    maxWidth: 460,
    margin: "0 auto",
  },
  communityLink: {
    display: "inline-block",
    marginTop: 28,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--forest)",
    textDecoration: "none",
    transition: "color 0.15s",
  },

  // Typewriter
  belowFold: {
    padding: "40px 40px 80px",
    borderTop: "1px solid var(--paper-dark)",
    maxWidth: 860,
    margin: "0 auto",
    width: "100%",
  },
  typewriterWrap: {
    minHeight: "2.2em",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typewriterLine: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic",
    fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
    color: "var(--ink-mid)",
    lineHeight: 1.45,
    textAlign: "center",
  },

  // Footer
  footer: {
    padding: "24px 40px",
    borderTop: "1px solid var(--paper-dark)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  footerLinks: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  footerLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    textDecoration: "none",
  },
  footerDot: {
    color: "var(--paper-dark)",
    fontSize: 10,
  },
  footerTagline: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  footerAuthor: {
    color: "var(--ink-mid)",
    textDecoration: "none",
  },
};
