# D1 migrations

Run every file in filename order. A migration file existing in Git does **not**
prove it has been applied to the production database.

| Order | File | Purpose |
|---|---|---|
| 1 | `0001_orders.sql` | `orders` table and lookup indexes |
| 2 | `0002_email_verifications.sql` | checkout email-verification codes |
| 3 | `0003_unique_pending_payment_quotes.sql` | unique pending quote fingerprint |
| 4 | `0004_paymegate_orders.sql` | Paymegate/card columns and unique provider ids |
| 5 | `0005_email_delivery.sql` | per-kind email delivery state on `orders` |
| 6 | `0006_email_outbox.sql` | persistent `email_outbox` retry queue |
| 7 | `0007_scope_pending_payment_quote_to_crypto.sql` | scopes the quote index to crypto orders |

Apply them with Wrangler so the remote database tracks what ran:

```bash
npx wrangler d1 migrations apply nexora-orders --remote
```

## Preflight before `0007` (read-only)

`0007` creates the crypto-scoped unique quote index before dropping the old
unscoped one, so a failure cannot leave `orders` without a quote constraint.
It can still fail if an environment never applied `0003` and already holds two
active crypto orders with the same amount. Check first:

```bash
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT currency, pay_amount, COUNT(*) AS n FROM orders WHERE status = 'pending' AND payment_provider = 'crypto' GROUP BY currency, pay_amount HAVING COUNT(*) > 1"
```

No rows means the migration can apply cleanly. Rows require a human decision
(which quote is real) — do not delete or merge orders to force the migration.

## Duplicate `0005` prefix (now `0006`)

`0005_email_outbox.sql` was originally committed with a duplicate `0005`
prefix and is now `0006_email_outbox.sql`.

Cloudflare D1 records applied migrations by **filename** in `d1_migrations`;
it does not treat a renamed file as already applied. Therefore:

- An environment that recorded `0005_email_outbox.sql` will run
  `0006_email_outbox.sql` once more on the next `migrations apply`.
- That re-run is a no-op for data: the file only contains
  `CREATE TABLE IF NOT EXISTS email_outbox` (with its inline `UNIQUE` and
  `CHECK` constraints), `CREATE INDEX IF NOT EXISTS`, and no `ALTER`/`DROP`/
  `DELETE`. The existing table, its rows, its indexes and its triggers are left
  untouched.
- An environment that never applied it creates the table once.
- The old name stays in `d1_migrations` as history; it is harmless and should
  not be deleted by hand.

`0007` depends on the `payment_provider` column added by `0004`. Running the
files out of order (for example executing `0007` alone with `d1 execute
--file` on a database without `0004`) fails with `no such column:
payment_provider`. Always use `d1 migrations apply`, which applies them in
filename order.

## Verify what production actually has (read-only)

```bash
# Applied migration names, in order
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id"

# Columns the confirmed-order email path writes
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT name FROM pragma_table_info('orders') WHERE name IN ('payment_provider','paymegate_order_uuid','owner_email_status','customer_email_status')"

# Outbox table and the pending-quote indexes
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT type, name FROM sqlite_master WHERE name IN ('email_outbox','idx_orders_pending_crypto_pay_amount','idx_orders_pending_currency_pay_amount')"
```

Without `0006` the confirmed-order email path cannot queue messages; with the
unscoped `0003` index still in place, a second pending card checkout for the
same template price fails.
