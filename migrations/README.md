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

`0005_email_outbox.sql` was originally committed with a duplicate `0005` prefix.
It is now `0006_email_outbox.sql`; its SQL is idempotent
(`CREATE TABLE IF NOT EXISTS`), so an environment that recorded the old name
simply re-runs it harmlessly.

## Verify what production actually has

```bash
# Applied migration names, in order
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id"

# Columns the confirmed-order email path writes
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT name FROM pragma_table_info('orders') WHERE name IN ('payment_provider','paymegate_order_uuid','owner_email_status','customer_email_status')"

# Outbox table and the scoped pending-quote index
npx wrangler d1 execute nexora-orders --remote \
  --command "SELECT type, name FROM sqlite_master WHERE name IN ('email_outbox','idx_orders_pending_crypto_pay_amount','idx_orders_pending_currency_pay_amount')"
```

Without `0006` (or with the unscoped `0003` index still in place), a second
pending card checkout for the same template price fails and the confirmed-order
email path cannot queue messages.
