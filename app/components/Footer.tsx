import { Link } from "@remix-run/react";

export function Footer() {
  return (
    <footer style={styles.footer} className="app-footer">
      <div style={styles.links}>
        <Link to="/terms" style={styles.link}>Terms</Link>
        <span style={styles.dot}>·</span>
        <Link to="/privacy" style={styles.link}>Privacy</Link>
        <span style={styles.dot}>·</span>
        <a href="/discord" target="_blank" rel="noopener noreferrer" style={styles.link}>Community</a>
        <span style={styles.dot}>·</span>
        <Link to="/extension" style={styles.link}>Extension</Link>
      </div>
      <p style={styles.tagline}>
        Made with curiosity by{" "}
        <Link to="/amrith" style={styles.authorLink}>@amrith</Link>
      </p>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    padding: "24px 32px",
    borderTop: "1px solid var(--paper-dark)",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  link: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: "var(--ink-light)",
    textDecoration: "none",
  },
  dot: {
    color: "var(--paper-dark)",
    fontSize: 10,
  },
  tagline: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: "var(--ink-light)",
  },
  authorLink: {
    color: "var(--ink-mid)",
    textDecoration: "none",
  },
};
