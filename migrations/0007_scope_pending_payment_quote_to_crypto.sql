-- The pending quote index exists only to stop two concurrent crypto orders
-- from sharing the same on-chain amount fingerprint (see 0003).
--
-- Paymegate/card orders store the catalogue price in `pay_amount` because
-- there is no on-chain amount to disambiguate. With the unscoped index, a
-- second pending card checkout for the same template price failed with
-- `UNIQUE constraint failed: orders.currency, orders.pay_amount` and returned
-- HTTP 500, blocking every other buyer of that template for as long as the
-- first order stayed `pending` (up to 24 hours).
--
-- Scoping the predicate keeps the crypto guarantee and lets independent
-- card orders coexist. The index is safe to recreate: it is derived data.
DROP INDEX IF EXISTS idx_orders_pending_currency_pay_amount;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pending_crypto_pay_amount
  ON orders (currency, pay_amount)
  WHERE status = 'pending' AND payment_provider = 'crypto';
