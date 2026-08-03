-- Orders table: one row per checkout attempt.
-- Payment is verified automatically by matching an exact, unique crypto
-- amount to an incoming on-chain transaction (see /api/cron/check-payments).
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  template_slug TEXT NOT NULL,
  template_title TEXT NOT NULL,
  base_price_usd REAL NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USDT', 'BTC')),
  wallet_address TEXT NOT NULL,
  pay_amount TEXT NOT NULL,        -- exact amount the buyer must send, as a decimal string
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'expired', 'review')),
  tx_hash TEXT,
  download_token TEXT UNIQUE,
  created_at INTEGER NOT NULL,     -- unix ms
  expires_at INTEGER NOT NULL,     -- unix ms
  confirmed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_currency_status ON orders (currency, status);
CREATE INDEX IF NOT EXISTS idx_orders_download_token ON orders (download_token);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders (tx_hash);
