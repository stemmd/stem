import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "Terms of Service — Stem" },
  { name: "description", content: "The rules for using stem.md — written in plain English." },
];

export default function Terms() {
  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link to="/" style={s.logo}>stem</Link>
      </header>

      <main style={s.main}>
        <p style={s.eyebrow}>Legal</p>
        <h1 style={s.title}>Terms of Service</h1>
        <p style={s.updated}>Last updated: March 31, 2026</p>

        {/* TL;DR */}
        <div style={s.tldr}>
          <p style={s.tldrLabel}>TL;DR</p>
          <ul style={s.tldrList}>
            <li>stem.md is a tool for organizing and sharing URLs and notes around topics you're exploring. Use it for that.</li>
            <li>You own your content. By posting it publicly, you're giving others permission to view it.</li>
            <li>Don't post illegal content, spam, or anything designed to harm others.</li>
            <li>We can suspend or remove accounts that violate these terms.</li>
            <li>The service is provided as-is. We're not liable for damages from using it.</li>
            <li>Questions? Email <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a>.</li>
          </ul>
        </div>

        <Section title="1. Accepting these terms">
          <p>By creating an account or using stem.md, you agree to these Terms of Service and our <Link to="/privacy" style={s.link}>Privacy Policy</Link>. If you don't agree, please don't use the service.</p>
          <p>stem.md is operated by Amrith Shanbhag ("we", "us", "Stem"). These terms apply to all users.</p>
        </Section>

        <Section title="2. What stem is">
          <p>stem is a tool for organizing URLs, notes, and ideas around topics you're actively exploring — things like "the history of jazz harmony" or "how cities work." You create stems (topics), add finds (links with notes), and optionally share them publicly.</p>
          <p>stem is <em>not</em> a social network built around follower counts or algorithmic feeds. It's a thinking tool that happens to be sharable.</p>
        </Section>

        <Section title="3. Your account">
          <ul style={s.list}>
            <li>You must be at least 13 years old to use stem.</li>
            <li>Your username must not impersonate another person or brand.</li>
            <li>You're responsible for keeping your account secure. Magic links and sign-in emails are single-use — don't forward them to others.</li>
            <li>You may only have one account. Duplicate accounts may be removed.</li>
          </ul>
        </Section>

        <Section title="4. Your content">
          <p>You own the content you create on Stem — your stems, finds, notes, and profile information.</p>
          <p>By posting content publicly, you grant stem a non-exclusive, worldwide, royalty-free license to display and distribute that content as part of operating the service (e.g., showing your stem to other users, including it in search results).</p>
          <p>This license ends when you delete your content or account.</p>
        </Section>

        <Section title="5. What you can't do">
          <p>You may not use stem to:</p>
          <ul style={s.list}>
            <li>Post content that's illegal, defamatory, or infringes on someone else's copyright or intellectual property.</li>
            <li>Harass, threaten, or harm other users.</li>
            <li>Spam — including bulk-adding low-quality finds or creating accounts to artificially inflate metrics.</li>
            <li>Scrape, crawl, or automate requests to Stem in a way that degrades performance for others.</li>
            <li>Attempt to access or modify another user's account or data.</li>
            <li>Use stem to distribute malware or phishing content.</li>
          </ul>
          <p>We reserve the right to determine what constitutes a violation of these rules. When in doubt, use common sense or ask us.</p>
        </Section>

        <Section title="6. Enforcement">
          <p>If you violate these terms, we may:</p>
          <ul style={s.list}>
            <li>Remove the offending content.</li>
            <li>Suspend or terminate your account, with or without notice depending on severity.</li>
          </ul>
          <p>For minor or accidental violations, we'll usually reach out before taking action. For serious violations (illegal content, harassment), we may act immediately.</p>
          <p>If you believe your account was suspended in error, email <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a>.</p>
        </Section>

        <Section title="7. Availability">
          <p>We aim to keep stem available and reliable, but we can't guarantee it. The service may be unavailable due to maintenance, outages, or circumstances outside our control.</p>
          <p>We may change, pause, or discontinue features at any time. If we decide to shut down stem entirely, we'll give users reasonable notice and a way to export their data.</p>
        </Section>

        <Section title="8. Disclaimer of warranties">
          <p>stem is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind, express or implied — including warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
          <p>We don't guarantee that stem will be error-free, uninterrupted, or that any content on it is accurate.</p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>To the maximum extent permitted by law, stem and its operators are not liable for any indirect, incidental, special, consequential, or punitive damages — including loss of data, loss of profits, or business interruption — arising from your use of (or inability to use) the service.</p>
          <p>Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim (which, for a free service, is $0).</p>
        </Section>

        <Section title="10. Links to other sites">
          <p>stem lets you save links to external websites. We don't endorse, control, or take responsibility for the content of those websites. Clicking an external link is at your own discretion.</p>
        </Section>

        <Section title="11. Privacy">
          <p>Your use of Stem is also governed by our <Link to="/privacy" style={s.link}>Privacy Policy</Link>, which is incorporated into these terms by reference.</p>
        </Section>

        <Section title="12. Governing law">
          <p>These terms are governed by the laws of the Netherlands. Any disputes will be resolved in the competent courts of Amsterdam, the Netherlands.</p>
        </Section>

        <Section title="13. Changes to these terms">
          <p>We may update these terms from time to time. We'll notify you of significant changes by email. The "last updated" date at the top of this page will always reflect the most recent version. Continued use of Stem after changes take effect means you accept the updated terms.</p>
        </Section>

        <Section title="14. Contact">
          <p>Questions about these terms? Email <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a>.</p>
        </Section>

        <div style={s.footer}>
          <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
          <span style={s.footerDot}>·</span>
          <Link to="/" style={s.footerLink}>Back to Stem</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={s.sectionTitle}>{title}</h2>
      <div style={s.sectionBody}>{children}</div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--paper)" },
  header: {
    padding: "20px 40px",
    borderBottom: "1px solid var(--paper-dark)",
  },
  logo: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 20,
    color: "var(--ink)",
    textDecoration: "none",
  },
  main: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "56px 24px 80px",
  },
  eyebrow: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    letterSpacing: "0.08em",
    marginBottom: 12,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 400,
    color: "var(--ink)",
    lineHeight: 1.15,
    marginBottom: 8,
  },
  updated: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    marginBottom: 40,
  },
  tldr: {
    background: "var(--leaf)",
    border: "1px solid var(--leaf-border)",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 48,
  },
  tldrLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    fontWeight: 400,
    color: "var(--forest)",
    letterSpacing: "0.1em",
    marginBottom: 12,
  },
  tldrList: {
    paddingLeft: 20,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.6,
  },
  sectionTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 12,
  },
  sectionBody: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    lineHeight: 1.7,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  list: {
    paddingLeft: 20,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  link: {
    color: "var(--forest)",
    textDecoration: "underline",
    textDecorationColor: "var(--branch)",
  },
  footer: {
    marginTop: 64,
    paddingTop: 24,
    borderTop: "1px solid var(--paper-dark)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  footerLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    textDecoration: "none",
  },
  footerDot: {
    color: "var(--paper-dark)",
  },
};
