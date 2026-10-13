CREATE TABLE portfolio_content (
  id INTEGER PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE portfolio_revisions (
  version INTEGER PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE portfolio_assets (
  asset_key TEXT PRIMARY KEY NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
