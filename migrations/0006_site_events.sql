CREATE TABLE IF NOT EXISTS site_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  path TEXT NOT NULL,
  locale TEXT,
  template_slug TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_events_created_at
  ON site_events(created_at);

CREATE INDEX IF NOT EXISTS idx_site_events_name_created
  ON site_events(event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_site_events_template_created
  ON site_events(template_slug, created_at);
