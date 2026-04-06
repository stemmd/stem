-- ── Rename finds → artifacts ─────────────────────────────────────────────────

ALTER TABLE finds RENAME TO artifacts;

-- Drop old indexes, recreate with new names
DROP INDEX IF EXISTS idx_finds_stem;
DROP INDEX IF EXISTS idx_finds_user;
DROP INDEX IF EXISTS idx_finds_stem_status;
CREATE INDEX idx_artifacts_stem ON artifacts(stem_id);
CREATE INDEX idx_artifacts_user ON artifacts(added_by);
CREATE INDEX idx_artifacts_stem_status ON artifacts(stem_id, status);

-- Add new columns for rich content types
ALTER TABLE artifacts ADD COLUMN body TEXT;
ALTER TABLE artifacts ADD COLUMN file_key TEXT;
ALTER TABLE artifacts ADD COLUMN file_mime TEXT;

-- Backward-compat view so stems-api keeps working
CREATE VIEW finds AS SELECT * FROM artifacts;

-- ── Rename find_id → artifact_id in notifications ───────────────────────────

CREATE TABLE notifications_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  stem_id TEXT REFERENCES stems(id),
  artifact_id TEXT REFERENCES artifacts(id),
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO notifications_new (id, user_id, type, actor_id, stem_id, artifact_id, read, created_at)
SELECT id, user_id, type, actor_id, stem_id, find_id, read, created_at
FROM notifications;

-- Update notification type strings
UPDATE notifications_new SET type = 'new_artifact' WHERE type = 'new_find';
UPDATE notifications_new SET type = 'artifact_approved' WHERE type = 'find_approved';

DROP TABLE notifications;
ALTER TABLE notifications_new RENAME TO notifications;

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ── Rename find_id → artifact_id in reports ─────────────────────────────────

CREATE TABLE reports_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id),
  FOREIGN KEY (reported_by) REFERENCES users(id)
);

INSERT INTO reports_new (id, artifact_id, reported_by, reason, created_at, resolved_at, resolved_by)
SELECT id, find_id, reported_by, reason, created_at, resolved_at, resolved_by
FROM reports;

DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;

CREATE INDEX idx_reports_artifact ON reports(artifact_id);

-- ── Nodes: organizational structure within a stem ───────────────────────────

CREATE TABLE IF NOT EXISTS nodes (
  id          TEXT PRIMARY KEY,
  stem_id     TEXT NOT NULL REFERENCES stems(id),
  parent_id   TEXT REFERENCES nodes(id),
  title       TEXT NOT NULL,
  description TEXT,
  emoji       TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'approved',
  created_by  TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_nodes_stem ON nodes(stem_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);

-- ── Junction: artifacts can belong to multiple nodes ────────────────────────

CREATE TABLE IF NOT EXISTS artifact_nodes (
  id           TEXT PRIMARY KEY,
  artifact_id  TEXT NOT NULL REFERENCES artifacts(id),
  node_id      TEXT NOT NULL REFERENCES nodes(id),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(artifact_id, node_id)
);

CREATE INDEX idx_artifact_nodes_artifact ON artifact_nodes(artifact_id);
CREATE INDEX idx_artifact_nodes_node ON artifact_nodes(node_id);
