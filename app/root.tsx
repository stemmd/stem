import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";
import { useEffect, useRef, useState } from "react";
import { API_BASE } from "~/lib/config";

export const links: LinksFunction = () => [
  { rel: "icon", type: "image/png", href: "https://assets.stem.md/stem-logo.png" },
  { rel: "shortcut icon", href: "https://assets.stem.md/stem-logo.png" },
  { rel: "apple-touch-icon", href: "https://assets.stem.md/stem-logo.png" },
  { rel: "manifest", href: "/manifest.json" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Stem" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#F7F4EF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C1B18" media="(prefers-color-scheme: dark)" />
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('stem-theme');if(t==='dark')document.documentElement.dataset.theme='dark';else if(t!=='system')document.documentElement.dataset.theme='light';})();` }} />
        <Meta />
        <Links />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-493GPLVVQZ" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-493GPLVVQZ');
        `}} />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          :root {
            --ink:         #1C1A17;
            --ink-mid:     #5C5850;
            --ink-light:   #9C9890;
            --paper:       #F7F4EF;
            --paper-mid:   #EDE9E2;
            --paper-dark:  #DDD8CF;
            --forest:      #2D5A3D;
            --branch:       #4A7A5C;
            --leaf:        #E8F0EB;
            --taken:       #8B4A3A;
            --surface:     #FFFFFF;
            --leaf-border: #c8dece;
            --cat-architecture:#f5ede4; --cat-art:#f5e8ef; --cat-biology:#e8f2e8;
            --cat-craft:#f2ede4; --cat-design:#eee8f2; --cat-economics:#e8edf2;
            --cat-film:#ede8f0; --cat-food:#f5ede4; --cat-health:#eaf0ea;
            --cat-history:#f2ece4; --cat-linguistics:#e8eaf2; --cat-literature:#f0ebe4;
            --cat-mathematics:#e4ecf2; --cat-music:#e4eaf5; --cat-nature:#e4f0e8;
            --cat-philosophy:#ece4f2; --cat-photography:#f0ece8; --cat-physics:#e4eef5;
            --cat-politics:#e8eee8; --cat-psychology:#f0e8f0; --cat-science:#e4f0f2;
            --cat-space:#e4e8f5; --cat-sport:#f2ece4; --cat-technology:#e8eef2;
            --cat-urbanism:#eeeae4;
            --cat-archaeology:#f2ebe0; --cat-cs:#e4ecf5; --cat-culture:#f0e8ed;
            --cat-education:#eae8f2; --cat-engineering:#eaeef0; --cat-environment:#e4f2ea;
            --cat-fashion:#f5e8f0; --cat-finance:#f0ede4; --cat-gaming:#e8e4f5;
            --cat-law:#eceae4; --cat-medicine:#e4f0ee; --cat-travel:#e8f0f5;

            /* Subtle paper grain — dark dots for the light palette */
            --paper-texture: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }

          @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
              --paper:       #1C1B18;
              --paper-mid:   #232118;
              --paper-dark:  #2E2B26;
              --surface:     #262520;
              --ink:         #E8E6E0;
              --ink-mid:     #9A9890;
              --ink-light:   #6A6862;
              --leaf:        #1E2A1C;
              --leaf-border: #2A4A30;
              --taken:       #C4645A;
              --cat-architecture:#2a2520; --cat-art:#2a2025; --cat-biology:#1e2a1e;
              --cat-craft:#282520; --cat-design:#242028; --cat-economics:#1e2228;
              --cat-film:#232028; --cat-food:#2a2520; --cat-health:#1f281f;
              --cat-history:#28251e; --cat-linguistics:#1e2028; --cat-literature:#28241e;
              --cat-mathematics:#1e2428; --cat-music:#1e2230; --cat-nature:#1e281f;
              --cat-philosophy:#241e28; --cat-photography:#282420; --cat-physics:#1e2430;
              --cat-politics:#202820; --cat-psychology:#282028; --cat-science:#1e2828;
              --cat-space:#1e2030; --cat-sport:#28251e; --cat-technology:#202428;
              --cat-urbanism:#26221e;
              --cat-archaeology:#28241a; --cat-cs:#1e2430; --cat-culture:#282024;
              --cat-education:#201e28; --cat-engineering:#20262a; --cat-environment:#1e2a20;
              --cat-fashion:#2a2028; --cat-finance:#28251e; --cat-gaming:#1e1e30;
              --cat-law:#24221e; --cat-medicine:#1e2826; --cat-travel:#1e2830;

              /* Paper grain for dark palette — light dots on deep paper */
              --paper-texture: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
            }
          }
          [data-theme="dark"] {
            --paper:       #1C1B18;
            --paper-mid:   #232118;
            --paper-dark:  #2E2B26;
            --surface:     #262520;
            --ink:         #E8E6E0;
            --ink-mid:     #9A9890;
            --ink-light:   #6A6862;
            --leaf:        #1E2A1C;
            --leaf-border: #2A4A30;
            --taken:       #C4645A;
            --cat-architecture:#2a2520; --cat-art:#2a2025; --cat-biology:#1e2a1e;
            --cat-craft:#282520; --cat-design:#242028; --cat-economics:#1e2228;
            --cat-film:#232028; --cat-food:#2a2520; --cat-health:#1f281f;
            --cat-history:#28251e; --cat-linguistics:#1e2028; --cat-literature:#28241e;
            --cat-mathematics:#1e2428; --cat-music:#1e2230; --cat-nature:#1e281f;
            --cat-philosophy:#241e28; --cat-photography:#282420; --cat-physics:#1e2430;
            --cat-politics:#202820; --cat-psychology:#282028; --cat-science:#1e2828;
            --cat-space:#1e2030; --cat-sport:#28251e; --cat-technology:#202428;
            --cat-urbanism:#26221e;

            --paper-texture: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }

          html, body {
            height: 100%;
            background-color: var(--paper);
            background-image: var(--paper-texture);
            background-repeat: repeat;
            color: var(--ink);
            font-family: 'DM Sans', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }

          a { color: inherit; text-decoration: none; }
          button { cursor: pointer; font-family: inherit; }
          input, textarea { font-family: inherit; }
          img { max-width: 100%; }

          .nav-hamburger { display: none; }

          @media (max-width: 600px) {
            .stem-nav { padding: 14px 16px !important; }
            .nav-profile, .nav-settings, .nav-signout { display: none !important; }
            .nav-hamburger { display: block !important; }
            .feed-find-note { display: none !important; }
          }

          @media (display-mode: standalone) {
            .app-footer { display: none !important; }
          }
          @media (max-width: 600px) {
            .app-footer { display: none !important; }
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }

          /* Reader mode article typography */
          .stem-reader-content h1,
          .stem-reader-content h2,
          .stem-reader-content h3,
          .stem-reader-content h4 {
            font-family: 'DM Serif Display', serif;
            font-weight: 400;
            color: var(--ink);
            line-height: 1.25;
            letter-spacing: -0.005em;
          }
          .stem-reader-content h1 { font-size: 28px; margin: 2em 0 0.6em; }
          .stem-reader-content h2 { font-size: 24px; margin: 1.8em 0 0.5em; }
          .stem-reader-content h3 { font-size: 20px; margin: 1.6em 0 0.4em; }
          .stem-reader-content h4 { font-size: 17px; margin: 1.4em 0 0.4em; font-weight: 600; font-family: 'DM Sans', sans-serif; }
          .stem-reader-content p { margin: 0 0 1.1em; }
          .stem-reader-content a {
            color: var(--forest);
            text-decoration: underline;
            text-decoration-color: var(--leaf-border);
            text-underline-offset: 3px;
            text-decoration-thickness: 1px;
          }
          .stem-reader-content a:hover {
            text-decoration-color: var(--forest);
          }
          .stem-reader-content img,
          .stem-reader-content figure img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            display: block;
            margin: 1.6em auto;
          }
          .stem-reader-content figure {
            margin: 1.6em 0;
          }
          .stem-reader-content figcaption {
            font-size: 13px;
            color: var(--ink-light);
            text-align: center;
            margin-top: 8px;
            font-style: italic;
          }
          .stem-reader-content blockquote {
            border-left: 3px solid var(--leaf-border);
            padding: 4px 18px;
            margin: 1.4em 0;
            color: var(--ink-mid);
            font-style: italic;
            font-family: 'DM Serif Display', serif;
            font-size: 18px;
            line-height: 1.55;
          }
          .stem-reader-content ul,
          .stem-reader-content ol {
            margin: 0 0 1.1em 1.4em;
            padding: 0;
          }
          .stem-reader-content li { margin: 0 0 0.4em; }
          .stem-reader-content code {
            font-family: 'DM Mono', monospace;
            font-size: 0.88em;
            background: var(--paper-mid);
            padding: 2px 6px;
            border-radius: 4px;
          }
          .stem-reader-content pre {
            font-family: 'DM Mono', monospace;
            font-size: 14px;
            line-height: 1.55;
            background: var(--paper-mid);
            border: 1px solid var(--paper-dark);
            border-radius: 10px;
            padding: 14px 16px;
            overflow-x: auto;
            margin: 1.2em 0;
          }
          .stem-reader-content pre code { background: transparent; padding: 0; }
          .stem-reader-content hr {
            border: none;
            border-top: 1px solid var(--paper-dark);
            margin: 2em 0;
          }
          .stem-reader-content table {
            border-collapse: collapse;
            margin: 1.4em 0;
            font-size: 15px;
            width: 100%;
          }
          .stem-reader-content th,
          .stem-reader-content td {
            border: 1px solid var(--paper-dark);
            padding: 8px 12px;
            text-align: left;
          }
          .stem-reader-content th {
            background: var(--paper-mid);
            font-weight: 600;
          }

          /* Note markdown typography — reused for both the rendered display
             and the Tiptap editor's contenteditable area so WYSIWYG feels
             true to the final look. */
          .stem-note-content,
          .stem-note-editor {
            font-family: 'DM Sans', sans-serif;
            font-size: 15px;
            line-height: 1.65;
            color: var(--ink);
            word-wrap: break-word;
          }
          .stem-note-content h1,
          .stem-note-content h2,
          .stem-note-content h3,
          .stem-note-editor h1,
          .stem-note-editor h2,
          .stem-note-editor h3 {
            font-family: 'DM Serif Display', serif;
            font-weight: 400;
            line-height: 1.25;
            letter-spacing: -0.005em;
            color: var(--ink);
          }
          .stem-note-content h1,
          .stem-note-editor h1 { font-size: 22px; margin: 1.2em 0 0.4em; }
          .stem-note-content h2,
          .stem-note-editor h2 { font-size: 19px; margin: 1.1em 0 0.35em; }
          .stem-note-content h3,
          .stem-note-editor h3 { font-size: 16px; margin: 1em 0 0.3em; font-weight: 600; font-family: 'DM Sans', sans-serif; }
          .stem-note-content p,
          .stem-note-editor p { margin: 0 0 0.75em; }
          .stem-note-content p:last-child,
          .stem-note-editor p:last-child { margin-bottom: 0; }
          .stem-note-content a,
          .stem-note-editor a {
            color: var(--forest);
            text-decoration: underline;
            text-decoration-color: var(--leaf-border);
            text-underline-offset: 3px;
            text-decoration-thickness: 1px;
          }
          .stem-note-content a:hover,
          .stem-note-editor a:hover { text-decoration-color: var(--forest); }
          .stem-note-content ul,
          .stem-note-content ol,
          .stem-note-editor ul,
          .stem-note-editor ol { margin: 0 0 0.75em 1.3em; padding: 0; }
          .stem-note-content li,
          .stem-note-editor li { margin: 0 0 0.25em; }
          .stem-note-content li > p,
          .stem-note-editor li > p { margin: 0; }
          .stem-note-content blockquote,
          .stem-note-editor blockquote {
            border-left: 3px solid var(--leaf-border);
            padding: 2px 14px;
            margin: 0.8em 0;
            color: var(--ink-mid);
            font-style: italic;
            font-family: 'DM Serif Display', serif;
            font-size: 16px;
            line-height: 1.5;
          }
          .stem-note-content code,
          .stem-note-editor code {
            font-family: 'DM Mono', monospace;
            font-size: 0.9em;
            background: var(--paper-mid);
            padding: 2px 5px;
            border-radius: 4px;
          }
          .stem-note-content pre,
          .stem-note-editor pre {
            font-family: 'DM Mono', monospace;
            font-size: 13px;
            line-height: 1.55;
            background: var(--paper-mid);
            border: 1px solid var(--paper-dark);
            border-radius: 8px;
            padding: 10px 12px;
            overflow-x: auto;
            margin: 0.8em 0;
          }
          .stem-note-content pre code,
          .stem-note-editor pre code { background: transparent; padding: 0; }
          .stem-note-content hr,
          .stem-note-editor hr {
            border: none;
            border-top: 1px solid var(--paper-dark);
            margin: 1.4em 0;
          }
          .stem-note-content img,
          .stem-note-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 0.8em 0;
            display: block;
          }

          /* Tiptap editor: contenteditable area sizing + placeholder */
          .stem-note-editor {
            outline: none;
          }
          .stem-note-editor p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: var(--ink-light);
            pointer-events: none;
            height: 0;
          }
          .stem-note-editor:focus-visible { outline: none; }
          /* Let the editor breathe inside its wrapper container */
          .ProseMirror { min-height: 80px; }
          .ProseMirror:focus { outline: none; }

          /* Page layout switches to flex when the reader is open */
          [data-reader-open="true"] .stem-page-layout {
            display: flex;
            flex-direction: row;
            align-items: stretch;
            height: calc(100vh - 60px);
            overflow: hidden;
          }
          [data-reader-open="true"] .stem-page-layout > main {
            flex: 0 0 38%;
            min-width: 320px;
            max-width: 480px;
            overflow-y: auto;
            padding-top: 24px;
            padding-bottom: 80px;
          }
          @media (max-width: 900px) {
            [data-reader-open="true"] .stem-page-layout > main {
              display: none;
            }
            [data-reader-open="true"] .stem-page-layout {
              height: calc(100vh - 60px);
            }
          }

        `}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
          // Pull-to-refresh for standalone PWA (iOS doesn't support it natively)
          if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
            (function() {
              var startY = 0, pulling = false, indicator = null;
              document.addEventListener('touchstart', function(e) {
                if (window.scrollY === 0) { startY = e.touches[0].pageY; pulling = true; }
              }, { passive: true });
              document.addEventListener('touchmove', function(e) {
                if (!pulling) return;
                var dy = e.touches[0].pageY - startY;
                if (dy > 0 && dy < 150 && window.scrollY === 0) {
                  if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'ptr';
                    indicator.style.cssText = 'position:fixed;top:0;left:0;right:0;display:flex;justify-content:center;padding:12px;z-index:9999;pointer-events:none;transition:opacity .2s;';
                    indicator.innerHTML = '<span style="font-size:13px;font-family:DM Sans,sans-serif;color:var(--ink-light)">Release to refresh</span>';
                    document.body.appendChild(indicator);
                  }
                  indicator.style.opacity = Math.min(dy / 80, 1);
                }
              }, { passive: true });
              document.addEventListener('touchend', function(e) {
                if (!pulling) return;
                pulling = false;
                var dy = (e.changedTouches[0] ? e.changedTouches[0].pageY : 0) - startY;
                if (indicator) { indicator.remove(); indicator = null; }
                if (dy > 80 && window.scrollY === 0) { location.reload(); }
              }, { passive: true });
            })();
          }
        `}} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$|^[a-z0-9]{3}$/;

export function ErrorBoundary() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  // For non-404 errors, show a simple error page
  if (!is404) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 16 }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--ink-light)" }}>500</p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400, color: "var(--ink)" }}>
          Something went wrong.
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "var(--ink-mid)", maxWidth: 340, lineHeight: 1.6 }}>
          An unexpected error occurred. Try refreshing.
        </p>
        <Link to="/" style={{ marginTop: 8, color: "var(--forest)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>
          Go home
        </Link>
      </div>
    );
  }

  return <NotFoundPage />;
}

function NotFoundPage() {
  const [state, setState] = useState<"loading" | "claimed" | "unclaimed">("loading");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function resolve() {
      const path = window.location.pathname.replace(/^\//, "").replace(/\/$/, "");

      // Multi-segment or empty → generic 404
      if (!path || path.includes("/") || !USERNAME_RE.test(path)) {
        setState("unclaimed");
        timerRef.current = setTimeout(() => setVisible(true), 50);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/check?username=${encodeURIComponent(path)}`);
        const data = await res.json<{ available: boolean }>();
        setState(data.available ? "unclaimed" : "claimed");
      } catch {
        setState("unclaimed");
      }
      timerRef.current = setTimeout(() => setVisible(true), 50);
    }

    resolve();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const isClaimed = state === "claimed";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes driftIn {
          to { transform: translateY(0); opacity: 0.45; }
        }
        .ghost-mark {
          position: absolute;
          right: -60px;
          bottom: -40px;
          width: 480px;
          height: 480px;
          color: var(--paper-dark);
          pointer-events: none;
          animation: driftIn 1.2s ease forwards;
          transform: translateY(20px);
          opacity: 0;
        }
        .not-found-content {
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .not-found-content.visible {
          opacity: 1;
        }
        .not-found-cta:hover { color: var(--branch) !important; }
        @media (max-width: 600px) {
          .not-found-logo { top: 24px !important; left: 24px !important; }
          .not-found-main { padding: 110px 24px 64px !important; align-items: flex-start !important; }
          .ghost-mark { width: 300px !important; height: 300px !important; right: -40px !important; bottom: -20px !important; }
          .not-found-footer { padding: 24px !important; flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
        }
      `}} />

      {/* Logo */}
      <a href="/" className="not-found-logo" style={{ position: "absolute", top: 32, left: 40, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", zIndex: 10 }}>
        <div style={{ width: 36, height: 36, backgroundColor: "var(--forest)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, color: "#FFFFFF" }}>
            <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "var(--ink)", lineHeight: 1 }}>stem</span>
      </a>

      <main className="not-found-main" style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 40px 80px", overflow: "hidden", minHeight: "100vh", flexDirection: "column" }}>
        {/* Ghost mark */}
        <svg className="ghost-mark" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <line x1="32" y1="68" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="32" y1="20" x2="32" y2="42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M32 42 Q46 38 52 28" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        </svg>

        <div className={`not-found-content${visible ? " visible" : ""}`} style={{ position: "relative", maxWidth: 520, width: "100%", zIndex: 1 }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "var(--ink-light)", letterSpacing: "0.08em", minHeight: "1em" }}>
            {isClaimed ? "" : "404"}
          </p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2.4rem, 6vw, 3.5rem)", lineHeight: 1.12, color: "var(--ink)", letterSpacing: "-0.01em", marginTop: 16, fontStyle: isClaimed ? "italic" : "normal" }}>
            {isClaimed ? <>Something is<br />growing here.</> : <>This trail hasn&rsquo;t been<br />cleared yet.</>}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--ink-mid)", lineHeight: 1.6, marginTop: 20, maxWidth: 380 }}>
            {isClaimed
              ? "This trail has been claimed. The explorer is still on their way."
              : "Whoever this belongs to hasn\u2019t arrived. Maybe that someone is you."}
          </p>
          <a href="/" className="not-found-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 40, fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", fontWeight: 500, color: "var(--forest)", textDecoration: "none", transition: "color 0.15s" }}>
            {isClaimed ? "Claim your own trail" : "Claim your trail"} <span style={{ fontSize: "1.1rem" }}>→</span>
          </a>
        </div>
      </main>

      <footer className="not-found-footer" style={{ padding: "28px 40px", borderTop: "1px solid var(--paper-dark)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8125rem", color: "var(--ink-light)" }}>stem.md</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/privacy" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "var(--ink-light)", textDecoration: "none" }}>Privacy</a>
          <a href="/terms" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "var(--ink-light)", textDecoration: "none" }}>Terms</a>
        </div>
      </footer>
    </>
  );
}
