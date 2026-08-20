CREATE TABLE IF NOT EXISTS qr_login_sessions (
  session_id TEXT PRIMARY KEY,
  record TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS qr_login_sessions_expires_at
  ON qr_login_sessions (expires_at);

CREATE TABLE IF NOT EXISTS qr_web_sessions (
  token TEXT PRIMARY KEY,
  record TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS qr_web_sessions_expires_at
  ON qr_web_sessions (expires_at);
