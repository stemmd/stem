import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy — Stem" },
  { name: "description", content: "How stem.md collects, uses, and protects your data." },
];

export default function Privacy() {
  return (
    <div style={s.page}>
      <header style={s.header}>
        <Link to="/" style={s.logo}>stem</Link>
      </header>

      <main style={s.main}>
        <p style={s.eyebrow}>Legal</p>
        <h1 style={s.title}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: March 31, 2026 · Operator based in the Netherlands · GDPR applies</p>

        {/* TL;DR */}
        <div style={s.tldr}>
          <p style={s.tldrLabel}>TL;DR</p>
          <ul style={s.tldrList}>
            <li>We collect your email address and the content you create (stems and finds).</li>
            <li>We use that data to run the app — nothing else. We don't sell it, share it for ads, or use it to profile you.</li>
            <li>We use Cloudflare to host everything and Resend to deliver sign-in emails. That's it for third parties.</li>
            <li>You own your content. You can ask us to delete your account and everything in it at any time.</li>
            <li>We use a cookie to keep you signed in. We also use Google Analytics to understand how the site is used — anonymously.</li>
          </ul>
        </div>

        <Section title="1. Who we are">
          <p>stem.md ("Stem", "we", "us") is a tool for organizing and sharing what you're exploring online. It's operated by Amrith Shanbhag, based in the Netherlands. Questions? Email us at <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a>.</p>
        </Section>

        <Section title="2. What we collect">
          <p>We collect only what's needed to run the service:</p>
          <ul style={s.list}>
            <li><strong>Account info:</strong> your email address and chosen username. Optionally, a display name and short bio if you add them in settings.</li>
            <li><strong>Content you create:</strong> stems (topics with titles and descriptions) and finds (URLs with optional notes) that you add.</li>
            <li><strong>Usage data:</strong> Google Analytics collects anonymized data about how pages are used (page views, general location by country, device type). No personal identifiers are sent to Google Analytics.</li>
            <li><strong>Sign-in tokens:</strong> when you request a magic link, we store a short-lived token (hashed) to verify your identity. It's deleted once used.</li>
            <li><strong>Sessions:</strong> after you sign in, we store a session token in a cookie to keep you logged in for 30 days.</li>
          </ul>
          <p>We do <em>not</em> collect passwords, payment information, or any data beyond what's listed above.</p>
        </Section>

        <Section title="3. How we use it">
          <ul style={s.list}>
            <li>To create and manage your account.</li>
            <li>To deliver sign-in emails via Resend.</li>
            <li>To display your stems and finds to you and, where public, to other users.</li>
            <li>To improve the product using anonymized analytics.</li>
          </ul>
          <p>We do not use your data for advertising, sell it to anyone, or share it with third parties except as described below.</p>
        </Section>

        <Section title="4. Legal basis for processing (GDPR)">
          <p>Because Stem is operated from the Netherlands, the General Data Protection Regulation (GDPR) applies. We process your personal data only where we have a lawful basis to do so:</p>
          <ul style={s.list}>
            <li><strong>Contract performance (Article 6(1)(b)):</strong> processing your email address and username is necessary to provide the service — creating your account, sending sign-in links, and displaying your content.</li>
            <li><strong>Legitimate interests (Article 6(1)(f)):</strong> we use anonymized analytics (Google Analytics) to understand how the product is used and improve it. This does not override your rights — the data is anonymized and you can opt out at any time.</li>
            <li><strong>Consent (Article 6(1)(a)):</strong> if you choose to sign in with Google, you consent to us receiving your name and email from Google for account creation purposes.</li>
          </ul>
          <p>We do not process your data for any purpose incompatible with the above. We do not use automated decision-making or profiling that produces legal or similarly significant effects.</p>
        </Section>

        <Section title="5. Data transfers outside the EU">
          <p>Some of our third-party providers (Cloudflare, Resend, Google) process data outside the European Economic Area. Where this occurs, we rely on Standard Contractual Clauses (SCCs) or adequacy decisions to ensure your data receives equivalent protection. You can request details of the safeguards in place by emailing us.</p>
        </Section>

        <Section title="6. Third-party services">
          <p>Running Stem requires a small number of third-party services. Each receives only the minimum data necessary:</p>
          <ul style={s.list}>
            <li><strong>Cloudflare</strong> (cloudflare.com) — hosts the app and database. All your data is stored on Cloudflare's infrastructure. Their privacy policy applies to infrastructure-level processing.</li>
            <li><strong>Resend</strong> (resend.com) — sends sign-in emails. We share your email address with Resend solely to deliver these emails.</li>
            <li><strong>Google Analytics</strong> — collects anonymized usage statistics. No personally identifiable information is sent. You can opt out using the <a href="https://tools.google.com/dlpage/gaoptout" style={s.link} target="_blank" rel="noopener noreferrer">Google Analytics opt-out browser add-on</a>.</li>
            <li><strong>Google Sign-In</strong> (if used) — if you choose to sign in with Google, we receive your name and email address from Google. We don't receive your Google password or any other account data.</li>
          </ul>
        </Section>

        <Section title="7. Your content and who can see it">
          <p>Stems and finds you create are <strong>public by default</strong> — anyone can view them, including people who aren't signed in. This is intentional: Stem is built around open exploration.</p>
          <p>Your email address is <strong>never</strong> shown publicly.</p>
          <p>If you'd like your content to be private, you can mark individual stems as private from the stem page. Private stems are only visible to you.</p>
        </Section>

        <Section title="8. Data retention">
          <p>We keep your data for as long as your account exists. If you delete your account, we delete your personal data (email, profile) and all content you created within 30 days. Anonymized analytics data may be retained longer.</p>
        </Section>

        <Section title="9. Your rights">
          <p>You can:</p>
          <ul style={s.list}>
            <li><strong>Access your data</strong> — email us and we'll send you an export.</li>
            <li><strong>Delete your account</strong> — email <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a> with the subject "Delete my account." We'll process it within 7 days.</li>
            <li><strong>Correct your data</strong> — update your profile from the Settings page, or email us for anything you can't change yourself.</li>
          </ul>
          <p>If you're in the EU or UK, you also have rights under GDPR/UK GDPR including the right to data portability and to lodge a complaint with a supervisory authority.</p>
        </Section>

        <Section title="10. Cookies">
          <p>We use one first-party cookie: <code style={s.code}>stem_session</code>, which keeps you signed in for 30 days. It's set as HttpOnly and Secure — it cannot be accessed by JavaScript and is only sent over HTTPS.</p>
          <p>Google Analytics sets its own cookies for usage tracking. See Google's cookie policy for details.</p>
        </Section>

        <Section title="11. Security">
          <p>We take reasonable precautions: all data is transmitted over HTTPS, sign-in tokens are stored as hashes (not plaintext), and sessions are cryptographically random. No system is perfectly secure, but we take these threats seriously.</p>
        </Section>

        <Section title="12. Children">
          <p>Stem is not directed at children under 13. We don't knowingly collect data from anyone under 13. If you believe a child has created an account, please email us and we'll remove it promptly.</p>
        </Section>

        <Section title="13. Changes to this policy">
          <p>If we make material changes, we'll update the date at the top of this page. For significant changes, we'll notify you by email. Continued use of Stem after changes means you accept the updated policy.</p>
        </Section>

        <Section title="14. Contact">
          <p>Questions or concerns about your privacy? Email <a href="mailto:hi@amrith.co" style={s.link}>hi@amrith.co</a>. We'll respond within 5 business days.</p>
        </Section>

        <div style={s.footer}>
          <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
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
  code: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    background: "var(--paper-mid)",
    padding: "1px 6px",
    borderRadius: 4,
    color: "var(--ink)",
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
