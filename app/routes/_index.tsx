import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getUser } from "~/lib/auth.server";
import { API_BASE } from "~/lib/config";
import { validateUsername } from "~/lib/username";
import {
  InteractiveStemMock,
  StemMock,
  FeedMock,
  BranchMock,
  ChromeExtensionMock,
  IOSAppMock,
} from "~/components/LandingMocks";

export const meta: MetaFunction = () => [
  { title: "Stem — Grow your curiosity" },
  { name: "description", content: "Stem is where curious people collect, share, and discover what they're learning. Find trails worth following." },
  { property: "og:site_name", content: "Stem" },
  { property: "og:title", content: "Stem — Grow your curiosity" },
  { property: "og:description", content: "Stem is where curious people collect, share, and discover what they're learning. Find trails worth following." },
  { property: "og:image", content: "https://stem.md/og-image.png" },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:site", content: "@stemmd" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getUser(request, context);
  if (user) throw redirect("/feed");
  return json({});
}

// ── Identity lines (scroll wall) ─────────────────────────────────────────────

const IDENTITY_LINES = [
  "For the person who has seventeen tabs open about the Byzantine Empire.",
  "For the one who sends their friends a link and a twelve-message explanation.",
  "For the person whose \"quick Google\" takes forty-five minutes.",
  "For the one who learned more from Wikipedia rabbit holes than from school.",
  "For the person who buys books faster than they finish them.",
  "For the one who pauses a movie to look something up and never comes back.",
  "For the one who fell in love with a subject they never studied.",
  "For those who have strong opinions about things nobody asked about.",
];

// ── Scroll reveal hook ───────────────────────────────────────────────────────

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

function useScrollReveal(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  // Theme
  const [isDark, setIsDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("stem-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(stored === "dark" || (!stored && prefersDark));
    setThemeReady(true);
  }, []);

  // Signup state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [inlineError, setInlineError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const currentUsernameRef = useRef("");

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

  // Scroll reveals
  const [wallRef, wallVisible] = useScrollReveal();
  const [bridgeRef, bridgeVisible] = useScrollReveal();
  const [beat1Ref, beat1Visible] = useScrollReveal();
  const [beat2Ref, beat2Visible] = useScrollReveal();
  const [beat3Ref, beat3Visible] = useScrollReveal();
  const [beat4Ref, beat4Visible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  const reveal = (visible: boolean, delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes staggerIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes typingAppear {
          from { opacity: 0; } to { opacity: 0.5; }
        }
        .follow-btn:hover { background: var(--forest) !important; color: #fff !important; border-color: var(--forest) !important; }
        .find-row-hover:hover { background: var(--paper-mid); }
        .find-row-hover:hover .find-title-text { color: var(--forest); }
        .checking-dot::after {
          content: '';
          display: inline-block;
          width: 5px; height: 5px;
          background: var(--ink-light);
          border-radius: 50%;
          margin-left: 6px; vertical-align: middle;
          animation: blink 1s ease infinite;
        }
        .username-row:focus-within { border-color: var(--forest) !important; }
        .submit-btn:hover:not(:disabled) { background: var(--branch) !important; transform: scale(1.01); }
        .signin-btn:hover { opacity: 0.85 !important; }
        .theme-toggle:hover { color: var(--ink) !important; }
        .beat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .beat-grid-flip .beat-vis { order: -1; }
        .identity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .platform-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        @media (max-width: 768px) {
          .identity-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .landing-headline { font-size: clamp(1.7rem, 7vw, 2.2rem) !important; }
          .beat-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .beat-grid-flip .beat-vis { order: 0 !important; }
          .identity-grid { grid-template-columns: 1fr !important; }
          .platform-grid { grid-template-columns: 1fr !important; }
          .landing-hero { padding: 80px 20px 48px !important; }
          .landing-footer-inner { flex-direction: column !important; gap: 36px !important; text-align: center !important; }
          .landing-footer-right { flex-direction: column !important; gap: 24px !important; align-items: center !important; }
        }
      `}} />

      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      {/* ── 1. Nav ── */}
      <nav style={styles.nav}>
        <a href="/" style={styles.navBrand}>
          <div style={styles.navLogoMark}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 24, height: 24, color: "#fff" }}>
              <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
              <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
              <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span style={styles.navWord}>stem</span>
        </a>
        <div style={styles.navRight}>
          <button
            style={{ ...styles.themeToggle, opacity: themeReady ? 1 : 0 }}
            className="theme-toggle"
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
          <Link to="/signin" className="signin-btn" style={styles.signInBtn}>Sign in</Link>
        </div>
      </nav>

      {/* ── 2. Hero ── */}
      <section style={styles.hero} className="landing-hero">
        <div style={styles.heroContent}>
          <h1 className="landing-headline" style={styles.headline}>
            Find trails worth following.<br />Leave trails worth finding.
          </h1>
          <p style={styles.subline}>A home for everything you're curious about</p>
          <div style={styles.heroMockWrap}>
            <InteractiveStemMock />
          </div>
        </div>
      </section>

      {/* ── 3. Scroll Wall ── */}
      <section ref={wallRef} style={styles.scrollWall}>
        <div className="identity-grid">
          {IDENTITY_LINES.map((line, i) => (
            <div key={i} style={{ ...styles.identityCard, ...reveal(wallVisible, i * 0.08) }}>
              <p style={styles.identityText}>{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Positioning Bridge ── */}
      <section ref={bridgeRef} style={{ ...styles.bridge, ...reveal(bridgeVisible) }}>
        <p style={styles.bridgeQuote}>
          What Goodreads did for books and Letterboxd did for films,
          Stem does for the rabbit holes that define your curiosity.
        </p>
      </section>

      {/* ── 5. Beat 1: Stems + Finds ── */}
      <section ref={beat1Ref} style={{ ...styles.beatSection, ...reveal(beat1Visible) }}>
        <div className="beat-grid">
          <div>
            <p style={styles.beatLabel}>STEMS + FINDS</p>
            <h2 style={styles.beatHeading}>Collect what catches your attention</h2>
            <p style={styles.beatBody}>
              Create a stem for anything you're exploring. Add the articles, videos,
              papers, and tools that shaped your thinking. Each stem is your public
              trail through a topic.
            </p>
            <p style={styles.beatNote}>Public by default. Private when you need it</p>
          </div>
          <div className="beat-vis">
            <StemMock />
          </div>
        </div>
      </section>

      {/* ── 6. Beat 2: Explore + Feed ── */}
      <section ref={beat2Ref} style={{ ...styles.beatSection, ...reveal(beat2Visible) }}>
        <div className="beat-grid beat-grid-flip">
          <div>
            <p style={styles.beatLabel}>EXPLORE + FEED</p>
            <h2 style={styles.beatHeading}>See what curious people are finding</h2>
            <p style={styles.beatBody}>
              Follow people and stems. Your feed shows you fresh finds from
              people exploring things you care about. Discover trails you never
              would have stumbled on alone.
            </p>
          </div>
          <div className="beat-vis">
            <FeedMock />
          </div>
        </div>
      </section>

      {/* ── 7. Beat 3: Branches ── */}
      <section ref={beat3Ref} style={{ ...styles.branchSection, ...reveal(beat3Visible) }}>
        <p style={styles.beatLabel}>BRANCHES</p>
        <h2 style={styles.beatHeading}>Explore topics together</h2>
        <p style={{ ...styles.beatBody, maxWidth: 460, margin: "0 auto", textAlign: "center" as const }}>
          Invite someone to co-curate a stem. Branches let two or more people
          build a shared collection. You bring the jazz, they bring the hip-hop,
          and together you map the whole lineage.
        </p>
        <div style={{ marginTop: 36 }}>
          <BranchMock />
        </div>
      </section>

      {/* ── 8. Beat 4: Save from Anywhere ── */}
      <section ref={beat4Ref} style={{ ...styles.platformSection, ...reveal(beat4Visible) }}>
        <div style={{ textAlign: "center" as const, marginBottom: 40 }}>
          <p style={styles.beatLabel}>SAVE FROM ANYWHERE</p>
          <h2 style={styles.beatHeading}>Two clicks from any page</h2>
          <p style={{ ...styles.beatBody, maxWidth: 460, margin: "0 auto" }}>
            See something worth saving? The Chrome extension and iOS app let you
            add any page to your stems without breaking your flow.
          </p>
        </div>
        <div className="platform-grid" style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={styles.platformCard}>
            <ChromeExtensionMock />
            <div style={styles.platformInfo}>
              <h3 style={styles.platformTitle}>Stem for Chrome</h3>
              <p style={styles.platformDesc}>Save any page to your stems, right from your browser</p>
              <span style={styles.platformBtnDisabled}>Coming soon</span>
            </div>
          </div>
          <div style={styles.platformCard}>
            <IOSAppMock />
            <div style={styles.platformInfo}>
              <h3 style={styles.platformTitle}>Stem for iOS</h3>
              <p style={styles.platformDesc}>Share from Safari, save on the go</p>
              <span style={styles.platformBtnDisabled}>Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Signup CTA ── */}
      <section ref={ctaRef} style={{ ...styles.ctaSection, ...reveal(ctaVisible) }}>
        <div style={styles.ctaInner}>
          {success ? (
            <div style={{ textAlign: "center" as const }}>
              <p style={styles.successMain}>stem.md/{username} is yours.</p>
              <p style={styles.successSub}>Check your email when we open the doors</p>
            </div>
          ) : (
            <>
              <h2 style={styles.ctaHeading}>Claim your trail</h2>
              <p style={styles.ctaSubline}>Your curiosity deserves a home</p>

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
                style={{ ...styles.statusMsg, color: statusColor, minHeight: "1.2em" }}
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

              <div className="cf-turnstile" data-sitekey="0x4AAAAAACzDdtqFQgWP_8FO" data-theme="auto" data-size="normal" style={{ marginTop: 14 }} />

              {checkState === "available" && (
                <button
                  className="submit-btn"
                  style={{ ...styles.submitBtn, opacity: (!canSubmit || submitting) ? 0.5 : 1, cursor: (!canSubmit || submitting) ? "not-allowed" : "pointer" }}
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Claiming..." : "Claim my trail"}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── 10. Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner} className="landing-footer-inner">
          <div style={styles.footerLeft}>
            <div style={styles.footerBrand}>
              <div style={styles.navLogoMark}>
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 20, height: 20, color: "#fff" }}>
                  <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <span style={styles.navWord}>stem</span>
            </div>
            <p style={styles.footerTagline}>Made with curiosity</p>
            <div style={styles.footerLegal}>
              <Link to="/terms" style={styles.footerLink}>Terms</Link>
              <span style={styles.footerDot}>·</span>
              <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
            </div>
          </div>
          <div style={styles.footerRight} className="landing-footer-right">
            <div style={styles.footerCol}>
              <p style={styles.footerColTitle}>Downloads</p>
              <span style={styles.footerLink}>iOS App</span>
              <span style={styles.footerLink}>Chrome Extension</span>
            </div>
            <div style={styles.footerCol}>
              <p style={styles.footerColTitle}>Explore</p>
              <Link to="/explore" style={styles.footerLink}>Discover stems</Link>
            </div>
            <div style={styles.footerCol}>
              <p style={styles.footerColTitle}>Community</p>
              <a href="/discord" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Nav
  nav: {
    position: "sticky" as const,
    top: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 40px",
    background: "var(--paper)",
    borderBottom: "1px solid var(--paper-dark)",
    zIndex: 20,
  },
  navBrand: {
    display: "flex", alignItems: "center", gap: 10,
    textDecoration: "none",
  },
  navLogoMark: {
    width: 32, height: 32,
    backgroundColor: "var(--forest)",
    borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  navWord: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20, color: "var(--ink)", lineHeight: 1,
  },
  navRight: {
    display: "flex", alignItems: "center", gap: 16,
  },
  themeToggle: {
    background: "none", border: "none",
    color: "var(--ink-light)", cursor: "pointer",
    padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "color 0.15s",
  },
  signInBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 500,
    color: "#fff", textDecoration: "none",
    border: "none", borderRadius: 8,
    padding: "7px 16px",
    background: "var(--forest)",
    transition: "opacity 0.15s",
  },

  // Hero
  hero: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "100px 40px 80px",
    minHeight: "calc(100vh - 60px)",
  },
  heroContent: {
    maxWidth: 680, width: "100%",
    textAlign: "center" as const,
  },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(2.2rem, 5vw, 3.25rem)",
    fontWeight: 400, color: "var(--ink)",
    lineHeight: 1.15, letterSpacing: "-0.01em",
    animation: "fadeIn 0.8s ease forwards",
    opacity: 0,
  },
  subline: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "1.05rem", color: "var(--ink-mid)",
    marginTop: 24, letterSpacing: "0.01em",
    animation: "fadeIn 0.8s ease 0.25s forwards",
    opacity: 0,
  },
  heroMockWrap: {
    marginTop: 56,
    display: "flex", justifyContent: "center",
    animation: "fadeUp 1s ease 0.5s forwards",
    opacity: 0,
  },

  // Scroll wall
  scrollWall: {
    maxWidth: 1080, margin: "0 auto",
    padding: "80px 40px 100px",
  },
  identityCard: {
    padding: "24px 28px",
    background: "var(--paper-mid)",
    borderRadius: 14,
    border: "1px solid var(--paper-dark)",
  },
  identityText: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic" as const,
    fontSize: 14.5, lineHeight: 1.55,
    color: "var(--ink-mid)",
  },

  // Positioning bridge
  bridge: {
    maxWidth: 620, margin: "0 auto",
    padding: "20px 40px 100px",
    textAlign: "center" as const,
  },
  bridgeQuote: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.35rem, 2.8vw, 1.8rem)",
    color: "var(--ink)",
    lineHeight: 1.45,
  },

  // Beat sections
  beatSection: {
    maxWidth: 1040, margin: "0 auto",
    padding: "0 40px 120px",
  },
  beatLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10, letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "var(--forest)",
    marginBottom: 16,
  },
  beatHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
    fontWeight: 400, color: "var(--ink)",
    lineHeight: 1.25, letterSpacing: "-0.01em",
    marginBottom: 20,
  },
  beatBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15.5, color: "var(--ink-mid)",
    lineHeight: 1.8,
  },
  beatNote: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: "var(--ink-light)",
    fontStyle: "italic" as const,
    marginTop: 20,
  },

  // Branch section
  branchSection: {
    maxWidth: 600, margin: "0 auto",
    padding: "0 40px 120px",
    textAlign: "center" as const,
  },

  // Platform section
  platformSection: {
    maxWidth: 1040, margin: "0 auto",
    padding: "0 40px 120px",
  },
  platformCard: {
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 16,
    padding: 28,
    display: "flex", flexDirection: "column" as const, gap: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  platformInfo: {
    display: "flex", flexDirection: "column" as const, gap: 6,
  },
  platformTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16, fontWeight: 600, color: "var(--ink)",
  },
  platformDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, color: "var(--ink-mid)", lineHeight: 1.6,
  },
  platformBtnDisabled: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 500,
    color: "var(--ink-light)",
    background: "var(--paper-mid)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 8,
    padding: "8px 18px",
    textAlign: "center" as const,
    marginTop: 12,
    display: "inline-block",
    alignSelf: "flex-start" as const,
  },

  // Signup CTA
  ctaSection: {
    background: "var(--paper-mid)",
    padding: "100px 40px",
  },
  ctaInner: {
    maxWidth: 440, margin: "0 auto",
    textAlign: "center" as const,
  },
  ctaHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
    fontWeight: 400, color: "var(--ink)",
    lineHeight: 1.25, marginBottom: 10,
  },
  ctaSubline: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15, color: "var(--ink-mid)",
    marginBottom: 32,
  },
  usernameRow: {
    display: "flex", alignItems: "center",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 10,
    background: "var(--surface)",
    overflow: "hidden",
    transition: "border-color 0.15s",
  },
  usernamePrefix: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.875rem",
    color: "var(--ink-mid)",
    padding: "14px 0 14px 16px",
    userSelect: "none" as const,
  },
  usernameInput: {
    flex: 1, border: "none", outline: "none",
    background: "transparent",
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.875rem", color: "var(--ink)",
    padding: "14px 16px 14px 2px",
  },
  statusMsg: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.8rem",
    marginTop: 10,
    textAlign: "left" as const,
  },
  emailInput: {
    width: "100%", boxSizing: "border-box" as const,
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 10,
    background: "var(--surface)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9375rem", color: "var(--ink)",
    padding: "14px 16px",
    marginTop: 12,
    outline: "none",
  },
  inlineError: {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.8rem",
    color: "var(--taken)",
    marginTop: 8,
    textAlign: "left" as const,
  },
  submitBtn: {
    width: "100%",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9375rem", fontWeight: 500,
    color: "var(--paper)", background: "var(--forest)",
    border: "none", borderRadius: 10,
    padding: "15px 20px", marginTop: 16,
    transition: "background 0.15s, transform 0.15s",
  },
  successMain: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.5rem", color: "var(--forest)",
  },
  successSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9375rem", color: "var(--ink-mid)",
    marginTop: 10,
  },

  // Footer
  footer: {
    padding: "56px 40px",
    borderTop: "1px solid var(--paper-dark)",
  },
  footerInner: {
    maxWidth: 1040, margin: "0 auto",
    display: "flex", justifyContent: "space-between",
    gap: 60,
  },
  footerLeft: {
    display: "flex", flexDirection: "column" as const, gap: 12,
  },
  footerBrand: {
    display: "flex", alignItems: "center", gap: 10,
  },
  footerTagline: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, color: "var(--ink-light)",
  },
  footerLegal: {
    display: "flex", gap: 8, marginTop: 4,
  },
  footerRight: {
    display: "flex", gap: 48,
  },
  footerCol: {
    display: "flex", flexDirection: "column" as const, gap: 8,
  },
  footerColTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 600, color: "var(--ink)",
    marginBottom: 4,
  },
  footerLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12, color: "var(--ink-light)",
    textDecoration: "none",
  },
  footerDot: {
    color: "var(--paper-dark)", fontSize: 10,
  },
};
