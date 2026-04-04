# Stem -- Product Brief (April 2026)

## What it is
Stem is a social discovery platform for intellectual curiosity. Users create **stems** (topic collections), save **finds** (links/resources) into them, and follow other people's explorations. Think Letterboxd for niche interests. Not a bookmark manager -- the core value is social discovery.

## Positioning
The guilt-free doomscroll. A breath of fresh air from political, divisive social media. Not news, not political. The audience is intellectually curious, more Twitter-native than Instagram-native. Time on Stem should feel enriching, never guilty.

## Terminology
- **Stem** -- a topic collection (e.g. "Byzantine Architecture")
- **Find** -- a link/resource inside a stem
- **Branch** -- a collaborative stem with co-curators (DB: `is_branch`, `branch_members`)
- **Trail** -- marketing/brand term only, never used in authenticated app UI
- **Feed** -- personalized stream from people and stems you follow

## Architecture
Four repos, all Cloudflare:

| Repo | Stack | Domain | Deploy |
|------|-------|--------|--------|
| `stem` | Remix v2 + Vite + Cloudflare Pages | stem.md | Auto (push to main -> GitHub Actions) |
| `stems-api` | Cloudflare Worker (single index.js) | api.stem.md | Manual (`npm run deploy`) |
| `stem-ios` | SwiftUI, iOS 17+ | App Store (pending) | Fastlane |
| `stem-chrome` | Chrome extension | Chrome Web Store | Manual |

Shared D1 database (SQLite). R2 for avatar storage. No Tailwind -- CSS custom properties + inline React styles everywhere.

## What's been built
- Full social platform: profiles, feeds, explore/search, follow users and stems, notifications
- Stem CRUD with emoji, categories, visibility (public/unlisted/private), contribution modes (open/mutuals/closed)
- Branches (collaborative stems) with member management
- Find submission with OG metadata fetching, pending/approved workflow, content moderation
- Google OAuth + Apple Sign-In, Turnstile captcha (skipped for iOS)
- Import from external sources (YouTube watch history, etc.)
- Chrome extension for quick-saving finds from any page
- Admin dashboard (users, stems, content moderation, domain blocking, analytics)
- Self-hosted analytics (client-side batching, POST /events)
- Data export (Markdown), account deletion
- Dark mode (warm brown-tinted palette, aligned across iOS and web)
- PWA support (manifest, service worker)

## Design principles
Light, airy, welcoming, intentional. Less is more. Encourage documenting, not just consuming. No screen time warnings -- going deeper should feel rewarding.

## Brand voice
Warm, personal, conversational. Like a friend describing the app over coffee. Avoid em-dashes (LLM tell), "obsessions" (negative), overusing "rabbit holes" (max 1x per page). No periods on short copy lines. Keep it tangible, never vague or fluffy.

## URL format
`stem.md/username/slug` (no @ prefix)
