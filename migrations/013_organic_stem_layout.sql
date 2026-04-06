-- Migration 013: Organic stem layout + featured stems enhancements
-- Adds positioning and side preference for the organic stem layout,
-- and enhances featured_stems for the editorial curation model.

-- ── Organic stem layout ──────────────────────────────────────────────────────

-- Position field for artifacts at stem root level (nodes already have `position`)
ALTER TABLE artifacts ADD COLUMN stem_position INTEGER;

-- Side preference: 0 = auto/alternating, 1 = left, 2 = right
ALTER TABLE artifacts ADD COLUMN stem_side INTEGER NOT NULL DEFAULT 0;
ALTER TABLE nodes ADD COLUMN stem_side INTEGER NOT NULL DEFAULT 0;

-- Backfill stem_position from creation order (approved artifacts only)
UPDATE artifacts SET stem_position = (
  SELECT COUNT(*) * 1000 FROM artifacts a2
  WHERE a2.stem_id = artifacts.stem_id
    AND a2.status = 'approved'
    AND a2.created_at <= artifacts.created_at
    AND a2.id <= artifacts.id
) WHERE stem_position IS NULL AND status = 'approved';

-- Index for position-based ordering
CREATE INDEX IF NOT EXISTS idx_artifacts_stem_position ON artifacts(stem_id, stem_position);

-- ── Featured stems enhancements ──────────────────────────────────────────────

-- Add context fields to featured_stems
ALTER TABLE featured_stems ADD COLUMN label TEXT;
ALTER TABLE featured_stems ADD COLUMN featured_by TEXT;
ALTER TABLE featured_stems ADD COLUMN expires_at TEXT;
