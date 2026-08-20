CREATE TABLE IF NOT EXISTS member_social_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS member_social_kv_updated_at
  ON member_social_kv (updated_at);
