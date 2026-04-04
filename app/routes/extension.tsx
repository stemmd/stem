import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { StemMark } from "~/components/StemMark";
import { Footer } from "~/components/Footer";

export const meta: MetaFunction = () => [
  { title: "Chrome Extension — Stem" },
  { name: "description", content: "Save any page to your Stem collections, right from your browser. Two clicks. That's it." },
  { property: "og:title", content: "Stem for Chrome" },
  { property: "og:description", content: "Save, curate, and share your finds. Right from your browser." },
];

const CHROME_STORE_URL = "https://chromewebstore.google.com/detail/stem";

export default function Extension() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      {/* Nav */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.wordmark}>
          <StemMark size={24} />
          <span>stem</span>
        </Link>
      </nav>

      <main style={styles.main}>
        {/* Hero */}
        <section style={styles.hero}>
          <p style={styles.badge}>Chrome Extension</p>
          <h1 style={styles.heading}>Save anything.<br />From anywhere.</h1>
          <p style={styles.sub}>
            Two clicks to save any page to your stems. The extension pulls the title, image, and description automatically. Just pick a stem and add a note.
          </p>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" style={styles.cta}>
            Add to Chrome
          </a>
        </section>

        {/* How it works */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>How it works</h2>
          <div style={styles.steps}>
            <div style={styles.step}>
              <span style={styles.stepNum}>1</span>
              <div>
                <p style={styles.stepTitle}>Click the Stem icon</p>
                <p style={styles.stepDesc}>On any page you want to save.</p>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>2</span>
              <div>
                <p style={styles.stepTitle}>Pick a stem</p>
                <p style={styles.stepDesc}>Choose which collection it belongs to.</p>
              </div>
            </div>
            <div style={styles.step}>
              <span style={styles.stepNum}>3</span>
              <div>
                <p style={styles.stepTitle}>Add a note</p>
                <p style={styles.stepDesc}>Say why it caught your attention. Or don't. Up to you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section style={styles.section}>
          <h2 style={styles.sectionHeading}>What you get</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🔗</span>
              <p style={styles.featureTitle}>Save from any page</p>
              <p style={styles.featureDesc}>Articles, YouTube videos, tools, recipes. If it has a URL, you can save it.</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✨</span>
              <p style={styles.featureTitle}>Auto metadata</p>
              <p style={styles.featureDesc}>Title, description, image, and favicon are pulled automatically.</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🔒</span>
              <p style={styles.featureTitle}>Private by default</p>
              <p style={styles.featureDesc}>Your browsing data stays in your browser. Only what you choose to save goes to Stem.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={styles.ctaSection}>
          <p style={styles.ctaText}>
            Built for the curious.
          </p>
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" style={styles.cta}>
            Add to Chrome
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: "1px solid var(--paper-dark)",
  },
  wordmark: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "var(--ink)",
    textDecoration: "none",
  },
  main: {
    flex: 1,
    maxWidth: 640,
    width: "100%",
    margin: "0 auto",
    padding: "0 20px 60px",
  },
  hero: {
    padding: "64px 0 48px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    textAlign: "center" as const,
    gap: 16,
  },
  badge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--forest)",
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    padding: "4px 12px",
    borderRadius: 20,
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(2rem, 5vw, 3rem)",
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.1,
  },
  sub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    color: "var(--ink-mid)",
    lineHeight: 1.6,
    maxWidth: 480,
  },
  cta: {
    display: "inline-block",
    padding: "12px 28px",
    background: "var(--forest)",
    color: "#fff",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    textDecoration: "none",
    marginTop: 8,
  },
  section: {
    padding: "40px 0",
    borderTop: "1px solid var(--paper-dark)",
  },
  sectionHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 24,
  },
  steps: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "var(--forest)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  stepTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
  },
  stepDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    marginTop: 2,
  },
  features: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  feature: {
    padding: "20px",
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    display: "block",
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: "var(--ink)",
  },
  featureDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-mid)",
    lineHeight: 1.5,
    marginTop: 4,
  },
  ctaSection: {
    padding: "48px 0",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
  },
  ctaText: {
    fontFamily: "'DM Serif Display', serif",
    fontStyle: "italic",
    fontSize: 20,
    color: "var(--ink-mid)",
  },
};
