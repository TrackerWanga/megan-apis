CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password TEXT,
  api_key TEXT UNIQUE,
  coins INTEGER DEFAULT 100,
  rate_limit INTEGER DEFAULT 50,
  is_admin BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS api_keys (
  key TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  rate_limit INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS usage (
  api_key TEXT,
  date TEXT,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (api_key, date)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('earn','spend','spin_win','bonus','admin_grant')),
  description TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO users (id, username, phone, email, password, api_key, coins, rate_limit, is_admin, active)
VALUES (
  'admin_001',
  'Tracker Wanga',
  '+254758476795',
  'trackerwanga254@gmail.com',
  'Wanga@2006',
  'megan_admin_master',
  999999,
  999999,
  1,
  1
);
