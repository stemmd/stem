import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getUser } from "~/lib/auth.server";
import { API_BASE } from "~/lib/config";
import { validateUsername } from "~/lib/username";
import { StemMockup, pickRandomStems } from "~/components/landing/StemMockup";
import type { StemData } from "~/components/landing/StemMockup";
import { ExploreMockup } from "~/components/landing/ExploreMockup";
import { ConvergenceSection } from "~/components/landing/ConvergenceSection";

export const meta: MetaFunction = () => [
  { title: "Stem \u2014 Grow your curiosity" },
  { name: "description", content: "Stem is the place your curiosity is looking for. Find trails worth following. Leave trails worth finding." },
  { property: "og:site_name", content: "Stem" },
  { property: "og:title", content: "Stem \u2014 Grow your curiosity" },
  { property: "og:description", content: "A place to publicly explore the topics you care about \u2014 and find others going down the same paths." },
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
  "For everyone who\u2019s ever gone too deep on something and loved it.",
  "For those who can\u2019t have lunch without watching a random YouTube video.",
  "For the person whose \u201cquick Google\u201d takes forty-five minutes.",
  "For the one who learned more from Wikipedia rabbit holes than from school.",
  "For those who\u2019ve explained the same obscure thing to three different people this week.",
  "For the person who buys books faster than they finish them.",
  "For the one who pauses a movie to look something up and never comes back.",
  "For those who\u2019ve said \u201cI\u2019ll just read one more article\u201d at midnight.",
  "For the person who found their favourite band through a documentary about something completely unrelated.",
  "For the one who can\u2019t walk past an interesting sign without photographing it.",
  "For those who have strong opinions about things nobody asked about.",
  "For the person who annotates everything they read.",
  "For the one who fell in love with a subject they never studied.",
  "For those who follow people online just to see what they\u2019re obsessing over next.",
  "For the person who finishes a book and immediately needs to talk about it with someone.",
  "For the one whose notes app is a graveyard of ideas they haven\u2019t forgotten.",
];

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ── Wavy divider ─────────────────────────────────────────────────────────────

function WavyDivider({ fillAbove, fillBelow }: { fillAbove?: string; fillBelow?: string } = {}) {
  return (
    <svg viewBox="0 0 1200 24" preserveAspectRatio="none" style={{ width: "100%", height: 24, display: "block" }}>
      {fillAbove && (
        <path
          d="M0 0 L0 12 Q150 0 300 12 Q450 24 600 12 Q750 0 900 12 Q1050 24 1200 12 L1200 0 Z"
          fill={fillAbove}
        />
      )}
      {fillBelow && (
        <path
          d="M0 24 L0 12 Q150 0 300 12 Q450 24 600 12 Q750 0 900 12 Q1050 24 1200 12 L1200 24 Z"
          fill={fillBelow}
        />
      )}
      <path
        d="M0 12 Q150 0 300 12 Q450 24 600 12 Q750 0 900 12 Q1050 24 1200 12"
        fill="none"
        stroke="var(--paper-dark)"
        strokeWidth="2"
      />
    </svg>
  );
}

// ── Noise texture (inline SVG data URI) ──────────────────────────────────────

const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`;
// ── Apps Section SVGs ────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <svg viewBox="0 0 180 360" fill="none" style={{ width: 220, height: "auto", maxWidth: "100%" }}>
      {/* Phone frame */}
      <rect x="4" y="4" width="172" height="352" rx="24" stroke="var(--ink-light)" strokeWidth="2" fill="var(--surface, var(--paper))" />
      {/* Dynamic island */}
      <rect x="64" y="12" width="52" height="8" rx="4" fill="var(--paper-dark)" />
      {/* Status bar */}
      <text x="16" y="32" fontFamily="DM Sans" fontSize="7" fontWeight="600" fill="var(--ink-mid)">9:41</text>
      <circle cx="148" cy="28" r="2" fill="var(--ink-mid)" />
      <circle cx="155" cy="28" r="2" fill="var(--ink-mid)" />
      <circle cx="162" cy="28" r="2" fill="var(--ink-mid)" />

      {/* Screen content — stem detail view */}
      <rect x="16" y="44" width="148" height="1" fill="var(--paper-dark)" />
      {/* Back arrow + header */}
      <text x="16" y="62" fontFamily="DM Sans" fontSize="8" fill="var(--forest)">‹ Back</text>
      {/* Stem header */}
      <text x="24" y="86" fontSize="22">🎵</text>
      <text x="50" y="82" fontFamily="DM Serif Display" fontSize="12" fill="var(--ink)">Jazz lineage</text>
      <text x="50" y="94" fontFamily="DM Mono" fontSize="6" fill="var(--ink-light)">@amrith + @jamie · 4 finds</text>
      <rect x="16" y="104" width="148" height="1" fill="var(--paper-dark)" />

      {/* Find rows */}
      <text x="24" y="120" fontFamily="DM Sans" fontSize="7" fill="var(--ink)">Miles Davis and the Birth of Cool</text>
      <text x="24" y="130" fontFamily="DM Mono" fontSize="5.5" fill="var(--ink-light)">npr.org</text>

      <text x="24" y="148" fontFamily="DM Sans" fontSize="7" fill="var(--ink)">The Anatomy of a Jazz Standard</text>
      <text x="24" y="158" fontFamily="DM Mono" fontSize="5.5" fill="var(--ink-light)">jstor.org</text>

      <text x="24" y="176" fontFamily="DM Sans" fontSize="7" fill="var(--ink)">How Coltrane changed harmony</text>
      <text x="24" y="186" fontFamily="DM Mono" fontSize="5.5" fill="var(--ink-light)">nytimes.com</text>

      <text x="24" y="204" fontFamily="DM Sans" fontSize="7" fill="var(--ink)">Blue Note Records: a visual history</text>
      <text x="24" y="214" fontFamily="DM Mono" fontSize="5.5" fill="var(--ink-light)">design.blog</text>

      {/* Share sheet overlay */}
      <rect x="8" y="240" width="164" height="108" rx="14" fill="var(--paper-mid)" stroke="var(--paper-dark)" strokeWidth="1" />
      <rect x="74" y="244" width="32" height="3" rx="1.5" fill="var(--paper-dark)" />
      <text x="24" y="264" fontFamily="DM Sans" fontSize="8" fontWeight="500" fill="var(--ink)">Share via</text>
      {/* Share icons row */}
      <circle cx="36" cy="282" r="12" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1" />
      <text x="31" y="285" fontSize="8">💬</text>
      <circle cx="68" cy="282" r="12" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1" />
      <text x="63" y="285" fontSize="8">📋</text>
      <circle cx="100" cy="282" r="12" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1" />
      <text x="95" y="285" fontSize="8">📧</text>
      <circle cx="132" cy="282" r="12" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1" />
      <text x="127" y="285" fontSize="8">⋯</text>
      {/* Save to Stem button */}
      <rect x="20" y="304" width="140" height="28" rx="8" fill="var(--forest)" />
      <text x="55" y="322" fontFamily="DM Sans" fontSize="9" fill="white" fontWeight="500">Save to Stem</text>

      {/* FAB */}
      <circle cx="148" cy="228" r="14" fill="var(--forest)" />
      <text x="144" y="233" fontFamily="DM Sans" fontSize="16" fill="white" fontWeight="300">+</text>

      {/* Home indicator */}
      <rect x="64" y="348" width="52" height="3" rx="1.5" fill="var(--paper-dark)" />
    </svg>
  );
}

function BrowserMockup() {
  return (
    <svg viewBox="0 0 400 280" fill="none" style={{ width: 420, height: "auto", maxWidth: "100%" }}>
      {/* Browser frame */}
      <rect x="2" y="2" width="396" height="276" rx="10" stroke="var(--ink-light)" strokeWidth="2" fill="var(--surface, var(--paper))" />
      {/* Title bar */}
      <rect x="2" y="2" width="396" height="32" rx="10" fill="var(--paper-mid)" />
      <rect x="2" y="24" width="396" height="10" fill="var(--paper-mid)" />
      {/* Window dots */}
      <circle cx="18" cy="18" r="4.5" fill="#FF5F57" />
      <circle cx="32" cy="18" r="4.5" fill="#FEBC2E" />
      <circle cx="46" cy="18" r="4.5" fill="#28C840" />
      {/* Tab */}
      <rect x="62" y="6" width="110" height="22" rx="6" fill="var(--paper)" />
      <text x="72" y="21" fontFamily="DM Sans" fontSize="8" fill="var(--ink-mid)">Urban foraging guide...</text>
      {/* Address bar */}
      <rect x="12" y="38" width="376" height="20" rx="6" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1" />
      <text x="24" y="51" fontFamily="DM Mono" fontSize="7" fill="var(--ink-light)">🔒 example.com/urban-foraging-beginners-guide</text>
      {/* Stem extension icon in toolbar */}
      <rect x="368" y="40" width="14" height="14" rx="3" fill="var(--forest)" />
      <g transform="translate(369, 41) scale(0.15)">
        <line x1="32" y1="68" x2="32" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <line x1="32" y1="20" x2="32" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <path d="M32 42 Q46 38 52 28" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </g>

      {/* Page content — article-like */}
      <rect x="24" y="72" width="200" height="10" rx="2" fill="var(--paper-dark)" opacity="0.5" />
      <rect x="24" y="88" width="320" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="98" width="300" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="108" width="280" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="118" width="240" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="134" width="310" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="144" width="290" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="154" width="260" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="170" width="300" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />
      <rect x="24" y="180" width="270" height="6" rx="2" fill="var(--paper-dark)" opacity="0.25" />

      {/* Extension popup overlay */}
      <rect x="240" y="60" width="148" height="178" rx="10" fill="var(--paper)" stroke="var(--paper-dark)" strokeWidth="1.5" />
      <g>
        {/* Popup header */}
        <text x="258" y="82" fontFamily="DM Serif Display" fontSize="11" fill="var(--ink)">Save to Stem</text>
        <rect x="252" y="90" width="124" height="1" fill="var(--paper-dark)" />

        {/* Current page preview */}
        <text x="258" y="108" fontFamily="DM Sans" fontSize="7" fill="var(--ink-mid)">Saving this page:</text>
        <rect x="252" y="114" width="124" height="22" rx="4" fill="var(--paper-mid)" />
        <text x="258" y="128" fontFamily="DM Sans" fontSize="7" fill="var(--ink)">Urban foraging beginners guide</text>

        {/* Choose stem */}
        <text x="258" y="152" fontFamily="DM Sans" fontSize="7" fill="var(--ink-mid)">Choose a stem:</text>
        <rect x="252" y="158" width="124" height="18" rx="4" fill="var(--paper-mid)" stroke="var(--forest)" strokeWidth="1" />
        <text x="258" y="170" fontFamily="DM Sans" fontSize="8" fill="var(--ink)">🌿 Urban foraging</text>
        <text x="364" y="170" fontFamily="DM Sans" fontSize="7" fill="var(--ink-light)">▾</text>

        {/* Save button */}
        <rect x="252" y="186" width="124" height="26" rx="6" fill="var(--forest)" />
        <text x="290" y="203" fontFamily="DM Sans" fontSize="9" fill="white" fontWeight="500">Save find</text>

        {/* Success check hint */}
        <text x="258" y="228" fontFamily="DM Mono" fontSize="6" fill="var(--forest)">✓ Saved to Urban foraging</text>
      </g>
    </svg>
  );
}
// ── Page component ───────────────────────────────────────────────────────────

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUsernameRef = useRef("");

  // Random stem selection (2 non-repeating, excluding Jazz lineage which is hardcoded in Beat 3)
  const [randomStems] = useState<StemData[]>(() => pickRandomStems(2, ["Jazz lineage"]));

  // Beat refs for fade-up
  const [beat1Ref, beat1Vis] = useInView();
  const [beat2Ref, beat2Vis] = useInView();
  const [beat3Ref, beat3Vis] = useInView();
  const [iosRef, iosVis] = useInView();
  const [chromeRef, chromeVis] = useInView();

  // Theme detection — check explicit dataset.theme first, then system preference
  useEffect(() => {
    const explicit = document.documentElement.dataset.theme;
    if (explicit) {
      setIsDark(explicit === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    setThemeReady(true);
  }, []);

  // Typewriter
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

  // Username checking
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
          setInlineError("just taken \u2014 try another");
          setCheckState("taken");
        } else if (data.error === "email_taken") {
          setInlineError("that email\u2019s already on the list");
        } else if (data.error === "captcha_failed") {
          setInlineError("Verification failed. Please wait a moment and try again.");
        } else {
          setInlineError("something went wrong \u2014 try again");
        }
      }
    } catch {
      setSubmitting(false);
      setInlineError("something went wrong \u2014 try again");
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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS_TEXT }} />
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      {/* ── Nav ── */}
      <nav style={styles.nav} className="landing-nav">
        <a href="/" style={styles.navLogo}>
          <div style={styles.logoMark}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: "#FFFFFF" }}>
              <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
              <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span style={styles.logoWord}>stem</span>
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
                <line x1="8" y1="1.5" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="13" x2="8" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1.5" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="13" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3.4" y1="3.4" x2="4.2" y2="4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11.8" y1="11.8" x2="12.6" y2="12.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="12.6" y1="3.4" x2="11.8" y2="4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="4.2" y1="11.8" x2="3.4" y2="12.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13.5 10.3A6 6 0 0 1 5.7 2.5 6.5 6.5 0 1 0 13.5 10.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <Link to="/signin" style={styles.signInBtn} className="signin-link">Sign in</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={styles.hero} className="landing-hero">
        <div style={styles.heroGrid} className="hero-grid">
          <div style={styles.heroText}>
            <h1 style={styles.headline} className="landing-headline">
              Find trails worth following.<br />Leave trails worth finding.
            </h1>
            <p style={styles.subline}>
              Stem is where your curiosity lives. Create collections of the best things you find online, and discover what others are exploring.
            </p>
            <div style={styles.heroCtas}>
              <button style={styles.heroBtn} className="hero-btn" onClick={() => scrollTo("signup")}>
                Get started
              </button>
              <button style={styles.heroSecondary} className="hero-secondary" onClick={() => scrollTo("problem")}>
                See how it works &darr;
              </button>
            </div>
          </div>
          <div style={styles.heroMockup} className="hero-mockup">
            <StemMockup
              emoji={randomStems[0].emoji}
              title={randomStems[0].title}
              finds={randomStems[0].finds}
              meta={`@${randomStems[0].author} · ${randomStems[0].finds.length} finds · public`}
              animated
            />
          </div>
        </div>
      </section>

      <WavyDivider fillAbove="var(--paper-mid)" />

      {/* ── Problem: Convergence ── */}
      <div id="problem">
        <ConvergenceSection />
      </div>

      <WavyDivider fillBelow="var(--paper-mid)" />

      {/* ── Beat 1: Your stems ── */}
      <section
        ref={beat1Ref}
        style={{ ...styles.beatSection, background: "var(--paper-mid)", opacity: beat1Vis ? 1 : 0, transform: beat1Vis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        className="beat-section"
      >
        <div style={styles.beatGrid} className="beat-grid">
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Your stems</p>
            <h2 style={styles.beatHeading}>Share what you're exploring</h2>
            <p style={styles.beatBody}>
              Create a stem for anything you're diving into. Add the articles,
              videos, papers, and podcasts that shaped your thinking. Your stems
              are public by default, so anyone curious about the same things can
              find you.
            </p>
          </div>
          <div className="beat-vis">
            <StemMockup
              emoji={randomStems[1].emoji}
              title={randomStems[1].title}
              finds={randomStems[1].finds}
              meta={`@${randomStems[1].author} · ${randomStems[1].finds.length} finds · public`}
              hoverable
            />
          </div>
        </div>
      </section>

      <WavyDivider fillAbove="var(--paper-mid)" />

      {/* ── Beat 2: Explore ── */}
      <section
        ref={beat2Ref}
        style={{ ...styles.beatSection, opacity: beat2Vis ? 1 : 0, transform: beat2Vis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        className="beat-section"
      >
        <div style={styles.beatGrid} className="beat-grid beat-grid-flip">
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Explore</p>
            <h2 style={styles.beatHeading}>Discover what others are exploring</h2>
            <p style={styles.beatBody}>
              Browse stems from across the community. Find people who are deep
              into the same things as you, or stumble onto something completely
              new. Every stem is a window into someone's curiosity.
            </p>
          </div>
          <div className="beat-vis">
            <ExploreMockup />
          </div>
        </div>
      </section>

      <WavyDivider fillBelow="var(--paper-mid)" />

      {/* ── Beat 3: Branches ── */}
      <section
        ref={beat3Ref}
        style={{ ...styles.beatSection, background: "var(--paper-mid)", opacity: beat3Vis ? 1 : 0, transform: beat3Vis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        className="beat-section"
      >
        <div style={styles.beatGrid} className="beat-grid">
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Branches</p>
            <h2 style={styles.beatHeading}>Explore together</h2>
            <p style={styles.beatBody}>
              Invite friends to co-curate a stem. Add finds together, build a
              shared collection around a topic you're both exploring. Like a
              collaborative playlist, but for curiosity.
            </p>
          </div>
          <div className="beat-vis">
            <StemMockup
              emoji="🎵"
              title="Jazz lineage"
              contributors={["amrith", "jamie"]}
              finds={[
                { title: "Miles Davis and the Birth of Cool", domain: "npr.org" },
                { title: "The Anatomy of a Jazz Standard", domain: "jstor.org" },
                { title: "How Coltrane changed harmony", domain: "nytimes.com" },
                { title: "Blue Note Records: a visual history", domain: "design.blog" },
              ]}
            />
          </div>
        </div>
      </section>

      <WavyDivider fillAbove="var(--paper-mid)" />

      {/* ── Beat: iOS App ── */}
      <section
        ref={iosRef}
        style={{ ...styles.beatSection, opacity: iosVis ? 1 : 0, transform: iosVis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        className="beat-section"
      >
        <div style={styles.beatGrid} className="beat-grid beat-grid-flip">
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>iOS app</p>
            <h2 style={styles.beatHeading}>Save from your phone</h2>
            <p style={styles.beatBody}>
              Found something worth keeping while you're out? Share it to Stem
              from any app on your phone. It lands in the right stem, ready
              for anyone following along.
            </p>
            <div style={styles.appBadge}>App Store &mdash; Coming soon</div>
          </div>
          <div className="beat-vis">
            <PhoneMockup />
          </div>
        </div>
      </section>

      <WavyDivider fillBelow="var(--paper-mid)" />

      {/* ── Beat: Chrome Extension ── */}
      <section
        ref={chromeRef}
        style={{ ...styles.beatSection, background: "var(--paper-mid)", opacity: chromeVis ? 1 : 0, transform: chromeVis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        className="beat-section"
      >
        <div style={styles.beatGrid} className="beat-grid">
          <div style={styles.beatText} className="beat-text">
            <p style={styles.beatLabel}>Chrome extension</p>
            <h2 style={styles.beatHeading}>Save while you browse</h2>
            <p style={styles.beatBody}>
              One click saves any page to a stem. The extension pulls the
              title and metadata automatically — just pick which stem it
              belongs to.
            </p>
            <div style={styles.appBadge}>Chrome Web Store &mdash; Coming soon</div>
          </div>
          <div className="beat-vis">
            <BrowserMockup />
          </div>
        </div>
      </section>

      <WavyDivider fillAbove="var(--paper-mid)" />

      {/* ── Typewriter ── */}
      <section style={styles.typewriterSection} className="typewriter-section">
        <div style={styles.typewriterWrap}>
          <p style={styles.typewriterLine}>{typewriterText || "\u00A0"}</p>
        </div>
      </section>

      <WavyDivider fillBelow="var(--paper-mid)" />

      {/* ── CTA ── */}
      <section id="signup" style={styles.ctaSection} className="cta-section">
        <div style={styles.ctaInner}>
          {success ? (
            <div style={styles.successWrap}>
              <p style={styles.successMain}>stem.md/{username} is yours.</p>
              <p style={styles.successSub}>We'll be in touch.</p>
            </div>
          ) : (
            <>
              <h2 style={styles.ctaHeading}>Start exploring</h2>
              <p style={styles.ctaSubline}>Pick a username and we'll save you a spot</p>

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
                <div style={styles.ctaOptions}>
                  {/* Google auth primary */}
                  <a
                    href={`/auth/google?username=${encodeURIComponent(username)}`}
                    style={styles.googleBtn}
                    className="google-btn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </a>

                  <div style={styles.orDivider}>
                    <span style={styles.orLine} />
                    <span style={styles.orText}>or</span>
                    <span style={styles.orLine} />
                  </div>

                  {/* Email secondary */}
                  <input
                    style={styles.emailInput}
                    type="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {inlineError && <div style={styles.inlineError}>{inlineError}</div>}
                  <div className="cf-turnstile" data-sitekey="0x4AAAAAACzDdtqFQgWP_8FO" data-theme="auto" data-size="normal" style={{ marginTop: 12 }} />
                  <button
                    className="submit-btn"
                    style={{ ...styles.submitBtn, opacity: (!canSubmit || submitting) ? 0.5 : 1, cursor: (!canSubmit || submitting) ? "not-allowed" : "pointer" }}
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Reserving\u2026" : "Reserve with email"}
                  </button>
                </div>
              )}

              <p style={styles.signInNote}>
                Already have an account? <Link to="/signin" style={styles.signInLink}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer} className="landing-footer">
        <div style={styles.footerLinks}>
          <Link to="/terms" style={styles.footerLink}>Terms</Link>
          <span style={styles.footerDot}>&middot;</span>
          <Link to="/privacy" style={styles.footerLink}>Privacy</Link>
          <span style={styles.footerDot}>&middot;</span>
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
// ── CSS ──────────────────────────────────────────────────────────────────────

const CSS_TEXT = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
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
  .google-btn:hover { box-shadow: 0 4px 16px rgba(45, 90, 61, 0.2) !important; transform: translateY(-1px); }
  .signin-link:hover { opacity: 0.9 !important; }
  .theme-toggle:hover { color: var(--ink) !important; }
  .hero-btn:hover { background: var(--branch) !important; transform: translateY(-1px); }
  .hero-secondary:hover { color: var(--ink) !important; }

  .landing-find-row:hover {
    background: var(--paper-mid) !important;
    padding-left: 6px !important;
  }

  .explore-card:hover {
    border-color: var(--forest) !important;
    box-shadow: 0 4px 16px rgba(28, 26, 23, 0.08) !important;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 60fr 40fr;
    gap: 60px;
    align-items: center;
  }

  .beat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
    max-width: 1040px;
    margin: 0 auto;
  }

  .beat-vis { display: flex; justify-content: center; }
  .beat-grid-flip .beat-vis { order: -1; }

  @media (max-width: 600px) {
    .landing-headline { font-size: clamp(1.7rem, 7vw, 2.2rem) !important; }
    .landing-nav { padding: 16px 20px !important; }
    .landing-hero { padding: 100px 24px 60px !important; min-height: auto !important; }
    .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .hero-mockup { display: block !important; }
    .beat-section { padding: 60px 24px !important; }
    .beat-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
    .beat-grid-flip .beat-vis { order: 0 !important; }
    .beat-text { max-width: 100% !important; }
    .cta-section { padding: 60px 24px !important; }
    .landing-footer { padding: 20px 24px !important; }
    .convergence-columns { grid-template-columns: 1fr !important; gap: 40px !important; }
    .convergence-section { padding: 60px 24px 40px !important; }
    .explore-grid { grid-template-columns: 1fr !important; }
    .stem-mockup { padding: 20px !important; max-width: 100% !important; }
    .typewriter-section { padding: 40px 24px !important; }
  }
`;
// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Nav
  nav: {
    position: "fixed",
    top: 0, left: 0, right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    zIndex: 10,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  navLogo: {
    display: "flex", alignItems: "center", gap: 10,
    textDecoration: "none",
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
  navRight: {
    display: "flex", alignItems: "center", gap: 16,
  },
  themeToggle: {
    background: "none",
    border: "none",
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.15s",
  },
  signInBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 500,
    color: "#fff",
    textDecoration: "none",
    border: "none",
    borderRadius: 8,
    padding: "7px 16px",
    background: "var(--forest)",
    transition: "opacity 0.15s",
  },

  // Hero
  hero: {
    position: "relative",
    minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "120px 40px 80px",
    background: `linear-gradient(180deg, var(--paper) 0%, var(--paper-mid) 100%)`,
  },
  heroGrid: { width: "100%", maxWidth: 1100 },
  heroText: {
    opacity: 0,
    animation: "fadeUp 0.7s ease forwards 0.1s",
  },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(2.2rem, 5vw, 3.25rem)",
    lineHeight: 1.15,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
  },
  subline: {
    marginTop: 20, fontSize: "1.0625rem",
    color: "var(--ink-mid)", fontWeight: 400, lineHeight: 1.7,
    maxWidth: 440,
  },
  heroCtas: {
    display: "flex", alignItems: "center", gap: 20,
    marginTop: 32,
    flexWrap: "wrap" as const,
  },
  heroBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15, fontWeight: 500,
    color: "#fff",
    background: "var(--forest)",
    border: "none",
    borderRadius: 10,
    padding: "13px 28px",
    cursor: "pointer",
    transition: "background 0.15s, transform 0.15s",
  },
  heroSecondary: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, fontWeight: 400,
    color: "var(--ink-mid)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    transition: "color 0.15s",
  },
  heroMockup: {
    display: "flex",
    justifyContent: "center",
  },

  // Beat sections
  beatSection: {
    padding: "80px 40px",
  },
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
  beatGrid: {},

  // App badges
  appBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
    background: "var(--paper-mid)",
    borderRadius: 6,
    padding: "5px 12px",
    marginTop: 20,
    display: "inline-block",
  },

  // Typewriter
  typewriterSection: {
    padding: "60px 40px",
    maxWidth: 860,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box" as const,
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

  // CTA section
  ctaSection: {
    padding: "80px 40px 100px",
    background: `linear-gradient(180deg, var(--paper-mid) 0%, var(--paper) 100%), ${NOISE_BG}`,
  },
  ctaInner: {
    maxWidth: 480,
    margin: "0 auto",
    textAlign: "center" as const,
  },
  ctaHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
    lineHeight: 1.2,
    color: "var(--ink)",
    letterSpacing: "-0.01em",
    marginBottom: 10,
  },
  ctaSubline: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    marginBottom: 32,
  },
  usernameRow: {
    display: "flex", alignItems: "stretch",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 10, overflow: "hidden",
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
    marginTop: 8, textAlign: "left" as const, transition: "color 0.15s",
  },
  ctaOptions: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "13px 20px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.9375rem",
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer",
    transition: "box-shadow 0.2s, transform 0.15s",
    boxSizing: "border-box" as const,
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "16px 0",
  },
  orLine: {
    flex: 1,
    height: 1,
    background: "var(--paper-dark)",
  },
  orText: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  emailInput: {
    width: "100%", background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)", borderRadius: 10, outline: "none",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem",
    color: "var(--ink)", padding: "13px 14px",
    transition: "border-color 0.15s", display: "block",
    boxSizing: "border-box" as const,
  },
  inlineError: {
    fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
    color: "var(--taken)", marginTop: 8, textAlign: "left" as const,
  },
  submitBtn: {
    marginTop: 10, width: "100%",
    background: "var(--paper)",
    color: "var(--forest)",
    border: "1.5px solid var(--forest)",
    borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem",
    fontWeight: 500, padding: "13px 20px",
    transition: "background 0.15s, transform 0.1s", display: "block",
    cursor: "pointer",
  },
  signInNote: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 24,
  },
  signInLink: {
    color: "var(--forest)",
    textDecoration: "none",
  },
  successWrap: { textAlign: "center" as const, padding: "40px 0" },
  successMain: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "1.5rem", color: "var(--forest)", lineHeight: 1.3,
  },
  successSub: { marginTop: 10, fontSize: "0.9375rem", color: "var(--ink-mid)" },

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
