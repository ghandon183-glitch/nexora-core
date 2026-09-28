ALTER TABLE orders ADD COLUMN owner_email_status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE orders ADD COLUMN customer_email_status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE orders ADD COLUMN owner_email_claimed_at INTEGER;
ALTER TABLE orders ADD COLUMN customer_email_claimed_at INTEGER;
ALTER TABLE orders ADD COLUMN email_last_error TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_email_delivery ON orders (status, owner_email_status, customer_email_status);