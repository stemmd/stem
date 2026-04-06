-- ── Add file_size column to artifacts (for storage quota tracking) ───────────

ALTER TABLE artifacts ADD COLUMN file_size INTEGER;

-- ── User blocks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  blocked_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX idx_user_blocks_user ON user_blocks(user_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_user_id);
