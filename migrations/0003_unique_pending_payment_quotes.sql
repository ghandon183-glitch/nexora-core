-- Close the race between the application-level collision check and INSERT.
-- The same payment fingerprint may be reused after an order is no longer pending.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pending_currency_pay_amount
  ON orders (currency, pay_amount)
  WHERE status = 'pending';
