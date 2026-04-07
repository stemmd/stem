-- Migration 014: Category suggestions
-- Allows users to suggest new categories for admin review

CREATE TABLE IF NOT EXISTS category_suggestions (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emoji       TEXT,
  suggested_by TEXT NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cat_suggestions_status ON category_suggestions(status);
