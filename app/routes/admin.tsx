import { Link, Outlet, useLocation } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { requireAdmin } from "~/lib/auth.server";
import { useState, useEffect, useCallback } from "react";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  return null;
}

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/waitlist", label: "Waitlist" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/stems", label: "Stems" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/domains", label: "Blocked Domains" },
  { to: "/admin/analytics", label: "Analytics" },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const ADMIN_RESPONSIVE_CSS = `
@media (max-width: 768px) {
  [data-admin-grid] { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
  [data-admin-table] { font-size: 12px !important; }
  [data-admin-table] [data-hide-mobile] { display: none !important; }
  [data-admin-card] { padding: 16px !important; }
  [data-admin-card] [data-card-number] { font-size: 28px !important; }
  [data-admin-search] { max-width: 100% !important; }
}
`;

export default function AdminLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [drawerOpen]);

  const navLinks = NAV_ITEMS.map((item) => {
    const active = item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        style={{
          ...styles.navLink,
          background: active ? "var(--leaf)" : "transparent",
          color: active ? "var(--forest)" : "var(--ink-mid)",
          fontWeight: active ? 600 : 400,
        }}
      >
        {item.label}
      </Link>
    );
  });

  if (isMobile) {
    return (
      <div style={{ ...styles.layout, flexDirection: "column" }}>
        <style dangerouslySetInnerHTML={{ __html: ADMIN_RESPONSIVE_CSS }} />

        {/* Top bar */}
        <div style={styles.topBar}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={styles.hamburger}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={styles.topBarTitle}>Admin</span>
        </div>

        {/* Backdrop */}
        {drawerOpen && (
          <div
            style={styles.backdrop}
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Drawer */}
        <aside
          style={{
            ...styles.drawer,
            transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          <Link to="/feed" style={styles.backLink}>← Back to Stem</Link>
          <h1 style={styles.title}>Admin</h1>
          <nav style={styles.nav}>{navLinks}</nav>
        </aside>

        <main style={styles.mainMobile}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_RESPONSIVE_CSS }} />
      <aside style={styles.sidebar}>
        <Link to="/feed" style={styles.backLink}>← Back to Stem</Link>
        <h1 style={styles.title}>Admin</h1>
        <nav style={styles.nav}>{navLinks}</nav>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--paper)",
  },
  // Desktop sidebar
  sidebar: {
    width: 220,
    padding: "24px 16px",
    borderRight: "1px solid var(--paper-dark)",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
  },
  // Mobile top bar
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  hamburger: {
    background: "none",
    border: "none",
    padding: 4,
    color: "var(--ink)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 18,
    fontWeight: 400,
    color: "var(--ink)",
  },
  // Mobile drawer
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    zIndex: 90,
  },
  drawer: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    padding: "24px 16px",
    background: "var(--paper)",
    borderRight: "1px solid var(--paper-dark)",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    transition: "transform 0.2s ease",
    overflowY: "auto",
  },
  backLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
    textDecoration: "none",
    marginBottom: 24,
  },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 24,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 6,
    transition: "background 0.1s",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    maxWidth: 1000,
    overflow: "auto",
  },
  mainMobile: {
    flex: 1,
    padding: "20px 16px",
    overflow: "auto",
  },
};
