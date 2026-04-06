# Session Handover: Node Architecture + Platform Features

## What was built in this session

### 1. Finds → Artifacts Rename (full-stack)
The entire codebase was renamed from "finds" to "artifacts" — database table, all SQL queries, TypeScript types, component names, form fields, UI text, notification types. This spans ~20 files in the `stem` repo and the `stems-api` Worker.

**Key files:** Every route file, `StemCard.tsx`, `notifications.server.ts`, `import-parser.ts`, landing page components.

**Database:** `ALTER TABLE finds RENAME TO artifacts` + new columns `body`, `file_key`, `file_mime`. A backward-compat view `CREATE VIEW finds AS SELECT * FROM artifacts` exists but can be dropped now that stems-api is updated.

**ID prefix:** Artifacts still use `fnd_` prefix (intentional — avoids breaking cached IDs across repos).

### 2. Node Architecture
Nodes are an organizational layer within stems — like folders/sub-topics. They support 3-level nesting (enforced in app code, not DB). Artifacts can be tagged to multiple nodes via a junction table.

**Database tables:**
- `nodes` — id, stem_id, parent_id (self-ref), title, description, emoji, position, status, created_by, created_at
- `artifact_nodes` — id, artifact_id, node_id, position, created_at (UNIQUE on artifact_id + node_id)

**Backend (in `$username_.$slug.tsx`):**
- Loader fetches nodes + artifact_nodes alongside artifacts
- Node tree computed with `useMemo` (approvedNodes, pendingNodes, rootNodes, childNodesMap, artifactToNodes, nodeToArtifacts)
- Action intents: `create_node`, `update_node`, `delete_node`, `reorder_nodes`, `assign_artifact_node`, `remove_artifact_node`, `suggest_node`, `approve_node`, `reject_node`
- `checkContributionPermission` helper handles permission checks for contributions (includes blocking check)

**Frontend (in `$username_.$slug.tsx`):**
- `DraggableNodeList` — owner drag-and-drop reordering of root nodes via HTML5 DnD API
- `NodeSection` — recursive collapsible outline component (3 levels max), shows artifact counts, "Also in" tags for multi-node artifacts
- `AddNodeForm` — inline form for creating nodes/sub-nodes
- `NodeMapView` — force-directed SVG graph view (toggle in stem header, visible when 2+ nodes), hand-rolled physics simulation with RAF cleanup
- Pending node suggestions visible to owners with approve/reject

### 3. Rich Content Types
**Note artifacts:** Full support — AddArtifactForm has a "Note" tab with title + body textarea. ArtifactCard renders notes inline. source_type = "note".

**File uploads (images + PDFs):**
- AddArtifactForm has Image tab (JPEG/PNG/WebP/GIF, 10MB max) and PDF tab (25MB max)
- Client uploads to `api.stem.md/upload`, gets `file_key`, then saves artifact via Remix form
- ArtifactCard renders images as `<img>` from `api.stem.md/files/{key}`, PDFs as download cards
- Upload gate: users need 1 approved link artifact before file uploads unlock
- stems-api handles: MIME validation (actual bytes), NSFW scanning (Workers AI), 100MB per-user quota, R2 storage

**Audio:** Not supported (intentionally excluded).

### 4. Content Source Integrations
Quick-add search buttons in the link tab of AddArtifactForm:
- **YouTube search** — requires `YOUTUBE_API_KEY` env var on Cloudflare Pages
- **arXiv search** — free API, no key needed
- **Wikipedia search** — free API, no key needed
- **DOI auto-detect** — paste a DOI, auto-fetches metadata from CrossRef
- **ISBN auto-detect** — paste an ISBN, auto-fetches metadata from Open Library

Each has a server-side proxy route (`api.search.youtube.tsx`, `api.search.arxiv.tsx`, `api.search.wikipedia.tsx`, `api.lookup.doi.tsx`, `api.lookup.isbn.tsx`).

### 5. User Blocking
- `user_blocks` table (user_id, blocked_user_id)
- API route: `api.block.tsx` (block/unblock, auto-unfollows both directions)
- Profile page: "Block"/"Unblock" button next to follow
- Feed + Explore: blocked users' content filtered from all queries
- Contributions: stem owner's blocks prevent blocked users from contributing
- Settings: "Blocked users" section with unblock buttons

### 6. Map View
Hand-rolled SVG force-directed graph in `NodeMapView` component:
- Spring simulation with repulsion, attraction, center gravity, velocity damping
- 100 frames max, uses requestAnimationFrame with proper cleanup
- Nodes as circles sized by artifact count, edges for parent-child relationships
- Click node to scroll to that section in outline view
- Toggle button in stem header (visible when 2+ approved nodes)

## Database migrations
| Migration | What it does |
|-----------|-------------|
| `011_nodes_and_artifacts.sql` | finds→artifacts rename, new columns, notifications/reports column renames, backward-compat view, nodes + artifact_nodes tables |
| `012_file_uploads_and_blocking.sql` | file_size column on artifacts, user_blocks table |

Both have been run on production.

## Architecture overview
```
stem (Remix + Cloudflare Pages)
  ├── app/routes/$username_.$slug.tsx  (~3000 lines, the "god file")
  │     Contains: loader, action (20+ intents), StemPage, AddArtifactForm,
  │     AddNodeForm, NodeSection, DraggableNodeList, NodeMapView,
  │     ArtifactCard, PendingSuggestions, PendingNodeRow, etc.
  │
  ├── app/routes/api.search.*.tsx     (YouTube, arXiv, Wikipedia proxy routes)
  ├── app/routes/api.lookup.*.tsx     (DOI, ISBN lookup proxy routes)
  ├── app/routes/api.block.tsx        (user blocking API)
  ├── app/routes/api.og.tsx           (OG metadata fetch proxy)
  │
  ├── app/components/StemCard.tsx      (artifactCount prop)
  ├── app/lib/notifications.server.ts  (artifact_id, new_artifact, artifact_approved)
  └── migrations/011, 012             (schema changes)

stems-api (Cloudflare Worker)
  ├── src/index.js                    (all endpoints, renamed to artifacts)
  ├── POST /upload                    (file upload → R2 + NSFW scan)
  ├── GET /files/:key                 (serve files from R2)
  └── DELETE /files/:key              (cleanup on artifact delete)
```

## Key design decisions
- **3-level nesting cap** on nodes (enforced in app code at `checkContributionPermission`)
- **Infinite breadth** — unlimited nodes per stem, unlimited siblings
- **Position ordering** — sparse numbering (0, 1000, 2000) for easy insert-between
- **`fnd_` ID prefix retained** for backward compatibility across repos
- **Backward-compat SQL view** (`CREATE VIEW finds AS SELECT * FROM artifacts`) still exists — can be dropped
- **No audio/video uploads** — YouTube links + embed handle video, audio excluded
- **100MB per-user storage quota** for file uploads
- **Upload gate** — 1 approved link artifact required before file uploads unlock
- **NSFW scanning** via Cloudflare Workers AI on image uploads
- **CSAM scanning** enabled at R2 bucket level via Cloudflare

## What's NOT built / deferred
- **iOS app updates** — needs node support, artifact rename, new content types
- **Chrome extension updates** — needs artifact rename in API calls + UI
- **Branch terminology rename** — orthogonal, UI-only pass (deferred)
- **Drag-reorder for child nodes** — only root-level nodes are draggable currently
- **Audio uploads** — intentionally excluded
- **Video uploads** — intentionally excluded (YouTube links suffice)
- **Automated image moderation in admin** — relies on NSFW pre-scan + user reports
- **Spotify podcast integration** — discussed but deprioritized
- **GitHub repo cards** — discussed but deprioritized

## The $username_.$slug.tsx file
This is the most critical file (~3000 lines). It contains the entire stem detail page: loader, 20+ action intents, and ~15 inline components. It would benefit from being split into smaller modules in a future session, but works correctly as-is. Key sections:

- **Lines 1-110:** Imports, interfaces (Stem, Artifact, Node, etc.)
- **Lines 112-235:** Loader (fetches stem, artifacts, nodes, permissions, etc.)
- **Lines 226-245:** `checkContributionPermission` helper
- **Lines 248-730:** Action function (20+ intent handlers)
- **Lines 732-960:** StemPage component (main layout, node outline, map toggle)
- **Lines 1145-1470:** AddArtifactForm (link, note, image, PDF tabs + search integrations)
- **Lines 1470-1550:** PendingSuggestions + PendingNodeRow
- **Lines 1710-1860:** DraggableNodeList + NodeSection (recursive outline)
- **Lines 1970-2100:** NodeMapView (force-directed SVG)
- **Lines 2150-2380:** ArtifactCard (link, note, image, PDF rendering)
- **Lines 2380-2900:** Styles object

## Environment variables needed
- `YOUTUBE_API_KEY` — set in Cloudflare Pages environment variables for YouTube search to work
- R2 bucket binding `BUCKET` — configured in stems-api wrangler.toml
- Workers AI binding `AI` — configured in stems-api wrangler.toml
