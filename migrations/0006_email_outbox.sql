-- Persistent email outbox for confirmed orders.
-- Each order has at most one owner message and one customer message.
CREATE TABLE IF NOT EXISTS email_outbox (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('owner', 'customer')),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  locked_at INTEGER,
  sent_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (order_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_due
  ON email_outbox (status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_email_outbox_order
  ON email_outbox (order_id);
