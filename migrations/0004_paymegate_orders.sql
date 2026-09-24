ALTER TABLE orders ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'crypto';
ALTER TABLE orders ADD COLUMN paymegate_order_uuid TEXT;
ALTER TABLE orders ADD COLUMN paymegate_transaction_uuid TEXT;
ALTER TABLE orders ADD COLUMN paymegate_transaction_ref TEXT;
ALTER TABLE orders ADD COLUMN paymegate_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paymegate_order_uuid ON orders (paymegate_order_uuid) WHERE paymegate_order_uuid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paymegate_event_id ON orders (paymegate_event_id) WHERE paymegate_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_provider_status ON orders (payment_provider, status);
