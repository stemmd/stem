import { Form, Link, useLocation } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import type { User } from "~/lib/auth.server";
import { StemMark } from "~/components/StemMark";

interface NavProps {
  user: User | null;
}

export function Nav({ user }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count from api.stem.md on mount and on navigation
  useEffect(() => {
    if (user) {
      fetch("https://api.stem.md/notifications/count", { credentials: "include" })
        .then((r) => r.json())
        .then((d: any) => setUnreadCount(d.count ?? 0))
        .catch(() => {});
    }
  }, [location.pathname, user?.id]);

  // Close on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <nav style={styles.nav} className="stem-nav">
      <Link to={user ? "/feed" : "/"} style={styles.wordmark}>
        <StemMark size={24} />
        <span>stem</span>
      </Link>

      <div style={styles.right}>
        {user ? (
          <>
            <Link to="/new" style={styles.newBtn}>New stem</Link>
            <Link to="/notifications" style={styles.bellLink} aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75v3.5L2.5 12v1h13v-1l-1.25-1.75V6.75C14.25 3.85 11.9 1.5 9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.25 14.5a1.75 1.75 0 003.5 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {unreadCount > 0 && (
                <span style={styles.badge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link to={`/${user.username}`} style={styles.profileLink} className="nav-profile">
              @{user.username}
            </Link>
            <Link to="/settings" style={styles.settingsLink} className="nav-settings">
              Settings
            </Link>
            <Form method="post" action="/auth/signout" style={{ display: "inline" }} className="nav-signout">
              <button type="submit" style={styles.signOutBtn}>Sign out</button>
            </Form>

            {/* Mobile menu */}
            <div ref={menuRef} className="nav-hamburger" style={styles.hamburgerWrap}>
              <button
                style={styles.hamburgerBtn}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>

              {menuOpen && (
                <div style={styles.dropdown}>
                  <Link to="/notifications" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                  </Link>
                  <Link to={`/${user.username}`} style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    @{user.username}
                  </Link>
                  <Link to="/settings" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <Form method="post" action="/auth/signout">
                    <button type="submit" style={styles.dropdownSignOut}>
                      Sign out
                    </button>
                  </Form>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/signin" style={styles.signInBtn}>Sign in</Link>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    borderBottom: "1px solid var(--paper-dark)",
    background: "var(--paper)",
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
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
  right: {
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  newBtn: {
    padding: "7px 16px",
    background: "var(--forest)",
    color: "#fff",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    textDecoration: "none",
  },
  profileLink: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "var(--ink-mid)",
    textDecoration: "none",
  },
  settingsLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    textDecoration: "none",
  },
  signOutBtn: {
    background: "none",
    border: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
    cursor: "pointer",
    padding: 0,
  },
  bellLink: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--ink-mid)",
    textDecoration: "none",
    padding: 4,
  },
  badge: {
    position: "absolute" as const,
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    background: "var(--taken)",
    color: "#fff",
    fontSize: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    lineHeight: 1,
  },
  signInBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#fff",
    textDecoration: "none",
    background: "var(--forest)",
    padding: "7px 16px",
    borderRadius: 8,
  },
  hamburgerWrap: {
    position: "relative" as const,
  },
  hamburgerBtn: {
    background: "none",
    border: "none",
    padding: "4px",
    color: "var(--ink)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  dropdown: {
    position: "absolute" as const,
    top: "calc(100% + 12px)",
    right: 0,
    background: "var(--surface)",
    border: "1px solid var(--paper-dark)",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    minWidth: 160,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  dropdownItem: {
    display: "block",
    padding: "12px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink)",
    textDecoration: "none",
    borderBottom: "1px solid var(--paper-mid)",
  },
  dropdownSignOut: {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    textAlign: "left" as const,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "var(--ink-light)",
    cursor: "pointer",
  },
};
