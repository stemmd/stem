import { Link, Outlet, useLocation } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { requireAdmin } from "~/lib/auth.server";

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

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <Link to="/feed" style={styles.backLink}>← Back to Stem</Link>
        <h1 style={styles.title}>Admin</h1>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => {
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
          })}
        </nav>
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
  sidebar: {
    width: 220,
    padding: "24px 16px",
    borderRight: "1px solid var(--paper-dark)",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
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
};
