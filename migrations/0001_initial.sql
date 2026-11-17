-- Curling-track: multi-tenant D1 schema. User/team ownership is always enforced by API.
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roster TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','team')),
  team_id TEXT REFERENCES teams(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK ((role='admin' AND team_id IS NULL) OR (role='team' AND team_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_accounts_team ON accounts(team_id);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  last_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS games (
  id TEXT NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  data TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  team_name TEXT,
  opponent TEXT,
  game_date TEXT,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  PRIMARY KEY (team_id, id)
);
CREATE INDEX IF NOT EXISTS idx_games_team_date ON games(team_id,deleted_at,game_date DESC);
