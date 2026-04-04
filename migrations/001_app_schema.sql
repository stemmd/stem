-- Users
CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  username       TEXT UNIQUE COLLATE NOCASE,   -- nullable: set via /claim after verify
  display_name   TEXT,
  avatar_url     TEXT,
  bio            TEXT,
  email          TEXT UNIQUE NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Magic link tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id),
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tokens_hash  ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_email ON auth_tokens(email);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Stems
CREATE TABLE IF NOT EXISTS stems (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  is_public   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_stems_user   ON stems(user_id);
CREATE INDEX IF NOT EXISTS idx_stems_status ON stems(status);
CREATE INDEX IF NOT EXISTS idx_stems_public ON stems(is_public);

-- Finds
CREATE TABLE IF NOT EXISTS finds (
  id          TEXT PRIMARY KEY,
  stem_id     TEXT NOT NULL REFERENCES stems(id),
  added_by    TEXT NOT NULL REFERENCES users(id),
  url         TEXT NOT NULL,
  title       TEXT,
  description TEXT,
  image_url   TEXT,
  favicon_url TEXT,
  note        TEXT,
  source_type TEXT NOT NULL DEFAULT 'article',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_finds_stem ON finds(stem_id);
CREATE INDEX IF NOT EXISTS idx_finds_user ON finds(added_by);

-- Stem follows
CREATE TABLE IF NOT EXISTS stem_follows (
  id          TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL REFERENCES users(id),
  stem_id     TEXT NOT NULL REFERENCES stems(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, stem_id)
);
CREATE INDEX IF NOT EXISTS idx_stem_follows_follower ON stem_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_stem_follows_stem     ON stem_follows(stem_id);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id           TEXT PRIMARY KEY,
  follower_id  TEXT NOT NULL REFERENCES users(id),
  following_id TEXT NOT NULL REFERENCES users(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower  ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Featured stems
CREATE TABLE IF NOT EXISTS featured_stems (
  id         TEXT PRIMARY KEY,
  stem_id    TEXT NOT NULL REFERENCES stems(id),
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
