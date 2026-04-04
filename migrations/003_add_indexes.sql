-- Performance indexes for common query patterns

-- Session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);

-- User lookups by username, email, google_id
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Stem queries (by owner, by owner+slug)
CREATE INDEX IF NOT EXISTS idx_stems_user_id ON stems(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stems_user_slug ON stems(user_id, slug);

-- Find queries (by stem + status, most common filter pattern)
CREATE INDEX IF NOT EXISTS idx_finds_stem_status ON finds(stem_id, status);
CREATE INDEX IF NOT EXISTS idx_finds_added_by ON finds(added_by);

-- Follow relationship lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stem_follows_follower ON stem_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_stem_follows_stem ON stem_follows(stem_id);

-- Grove member lookups
CREATE INDEX IF NOT EXISTS idx_grove_members_grove ON grove_members(grove_id);
CREATE INDEX IF NOT EXISTS idx_grove_members_user ON grove_members(user_id);

-- Category lookups
CREATE INDEX IF NOT EXISTS idx_stem_categories_stem ON stem_categories(stem_id);
CREATE INDEX IF NOT EXISTS idx_stem_categories_cat ON stem_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);

-- Auth token lookups
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_email ON auth_tokens(email, created_at);
