import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Order {
  id: string;
  template_slug: string;
  template_title: string;
  base_price_usd: number;
  currency: "USDT" | "BTC";
  wallet_address: string;
  pay_amount: string;
  buyer_name: string;
  buyer_email: string;
  status: "pending" | "confirmed" | "expired" | "review";
  tx_hash: string | null;
  download_token: string | null;
  created_at: number;
  expires_at: number;
  confirmed_at: number | null;
  payment_provider?: "crypto" | "paymegate";
  paymegate_order_uuid?: string | null;
  paymegate_transaction_uuid?: string | null;
  paymegate_transaction_ref?: string | null;
  paymegate_event_id?: string | null;
  owner_email_status?: "pending" | "sending" | "sent";
  customer_email_status?: "pending" | "sending" | "sent";
  owner_email_claimed_at?: number | null;
  customer_email_claimed_at?: number | null;
  email_last_error?: string | null;
}

export async function getOrdersDb() {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as { ORDERS_DB?: D1Database }).ORDERS_DB;

  if (!db) {
    throw new Error(
      "ORDERS_DB binding is not available. This only works when deployed " +
        "to Cloudflare Workers (or via `wrangler dev`/`opennextjs-cloudflare preview`), " +
        "not plain `next dev`."
    );
  }

  return db;
}

export async function insertOrder(order: Order): Promise<void> {
  const db = await getOrdersDb();

  await db
    .prepare(
      `INSERT INTO orders (
        id, template_slug, template_title, base_price_usd, currency,
        wallet_address, pay_amount, buyer_name, buyer_email, status,
        tx_hash, download_token, created_at, expires_at, confirmed_at,
        payment_provider, paymegate_order_uuid, paymegate_transaction_uuid,
        paymegate_transaction_ref, paymegate_event_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      order.id,
      order.template_slug,
      order.template_title,
      order.base_price_usd,
      order.currency,
      order.wallet_address,
      order.pay_amount,
      order.buyer_name,
      order.buyer_email,
      order.status,
      order.tx_hash,
      order.download_token,
      order.created_at,
      order.expires_at,
      order.confirmed_at,
      order.payment_provider ?? "crypto",
      order.paymegate_order_uuid ?? null,
      order.paymegate_transaction_uuid ?? null,
      order.paymegate_transaction_ref ?? null,
      order.paymegate_event_id ?? null
    )
    .run();
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = await getOrdersDb();
  const result = await db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .bind(id)
    .first<Order>();
  return result ?? null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const db = await getOrdersDb();
  const result = await db
    .prepare("SELECT * FROM orders WHERE download_token = ?")
    .bind(token)
    .first<Order>();
  return result ?? null;
}

export async function hasPendingPayAmount(
  currency: "USDT" | "BTC",
  payAmount: string
): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare(
      "SELECT 1 AS found FROM orders WHERE status = 'pending' AND currency = ? AND pay_amount = ? LIMIT 1"
    )
    .bind(currency, payAmount)
    .first<{ found: number }>();
  return Boolean(result);
}

export async function getPendingOrderCount(
  currency?: "USDT" | "BTC"
): Promise<number> {
  const db = await getOrdersDb();
  const stmt = currency
    ? db
        .prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending' AND currency = ?")
        .bind(currency)
    : db.prepare("SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'");
  const result = await stmt.first<{ count: number }>();
  return Number(result?.count ?? 0);
}

export async function getPendingOrders(
  currency?: "USDT" | "BTC",
  limit = 15,
  paymentProvider: "crypto" | "paymegate" = "crypto"
): Promise<Order[]> {
  const db = await getOrdersDb();
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  const stmt = currency
    ? db
        .prepare(
          "SELECT * FROM orders WHERE status = 'pending' AND currency = ? AND payment_provider = ? ORDER BY created_at ASC LIMIT ?"
        )
        .bind(currency, paymentProvider, safeLimit)
    : db
        .prepare(
          "SELECT * FROM orders WHERE status = 'pending' AND payment_provider = ? ORDER BY created_at ASC LIMIT ?"
        )
        .bind(paymentProvider, safeLimit);
  const result = await stmt.all<Order>();
  return result.results ?? [];
}

export async function getRecentOrders(limit = 100): Promise<Order[]> {
  const db = await getOrdersDb();
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const result = await db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .bind(safeLimit)
    .all<Order>();
  return result.results ?? [];
}

/**
 * Atomically claims a pending order for confirmation. Returning false means
 * another cron invocation already changed the order, so callers must not
 * send a duplicate email or overwrite its download token.
 */
export async function markOrderConfirmed(
  id: string,
  txHash: string,
  downloadToken: string
): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare(
      `UPDATE orders
       SET status = 'confirmed', tx_hash = ?, download_token = ?, confirmed_at = ?,
           owner_email_status = 'pending', customer_email_status = 'pending',
           owner_email_claimed_at = NULL, customer_email_claimed_at = NULL, email_last_error = NULL
       WHERE id = ? AND status = 'pending'`
    )
    .bind(txHash, downloadToken, Date.now(), id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}

export async function attachPaymegateOrder(
  id: string,
  paymegateOrderUuid: string
): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare(
      `UPDATE orders
       SET paymegate_order_uuid = ?
       WHERE id = ? AND status = 'pending' AND payment_provider = 'paymegate'`
    )
    .bind(paymegateOrderUuid, id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function markPaymegateConfirmed(
  id: string,
  transactionUuid: string,
  transactionRef: string,
  eventId: string,
  downloadToken: string
): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare(
      `UPDATE orders
       SET status = 'confirmed', tx_hash = ?, download_token = ?, confirmed_at = ?,
           owner_email_status = 'pending', customer_email_status = 'pending',
           owner_email_claimed_at = NULL, customer_email_claimed_at = NULL, email_last_error = NULL,
           paymegate_transaction_uuid = ?, paymegate_transaction_ref = ?, paymegate_event_id = ?
       WHERE id = ? AND status = 'pending' AND payment_provider = 'paymegate'`
    )
    .bind(
      transactionRef || transactionUuid,
      downloadToken,
      Date.now(),
      transactionUuid,
      transactionRef,
      eventId,
      id
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function getOrderByPaymegateUuid(uuid: string): Promise<Order | null> {
  const db = await getOrdersDb();
  const result = await db
    .prepare("SELECT * FROM orders WHERE paymegate_order_uuid = ?")
    .bind(uuid)
    .first<Order>();
  return result ?? null;
}

export async function markOrderExpired(id: string): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare("UPDATE orders SET status = 'expired' WHERE id = ? AND status = 'pending'")
    .bind(id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function markOrderReview(id: string): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare("UPDATE orders SET status = 'review' WHERE id = ? AND status = 'pending'")
    .bind(id)
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/**
 * Manual override for the admin panel. Returns false if the order was already
 * confirmed, preventing duplicate download-token rotation and duplicate email.
 */
export async function adminForceConfirm(
  id: string,
  downloadToken: string
): Promise<boolean> {
  const db = await getOrdersDb();
  const result = await db
    .prepare(
      `UPDATE orders
       SET status = 'confirmed', tx_hash = COALESCE(tx_hash, 'manual-admin-override'),
           download_token = ?, confirmed_at = ?, owner_email_status = 'pending', customer_email_status = 'pending',
           owner_email_claimed_at = NULL, customer_email_claimed_at = NULL, email_last_error = NULL
       WHERE id = ? AND status != 'confirmed'`
    )
    .bind(downloadToken, Date.now(), id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}


export async function getOrdersNeedingEmailDelivery(limit = 25): Promise<Order[]> {
  const db = await getOrdersDb();
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const result = await db.prepare(
    `SELECT * FROM orders
     WHERE status = 'confirmed'
       AND (owner_email_status != 'sent' OR customer_email_status != 'sent')
     ORDER BY confirmed_at ASC
     LIMIT ?`
  ).bind(safeLimit).all<Order>();
  return result.results ?? [];
}

export async function claimOrderEmail(
  id: string,
  kind: "owner" | "customer"
): Promise<boolean> {
  const db = await getOrdersDb();
  const now = Date.now();
  const column = kind === "owner" ? "owner_email_status" : "customer_email_status";
  const claimedColumn = kind === "owner" ? "owner_email_claimed_at" : "customer_email_claimed_at";
  const result = await db.prepare(
    `UPDATE orders
     SET ${column} = 'sending', ${claimedColumn} = ?
     WHERE id = ? AND status = 'confirmed'
       AND (${column} = 'pending' OR (${column} = 'sending' AND COALESCE(${claimedColumn}, 0) < ?))`
  ).bind(now, id, now - 10 * 60 * 1000).run();
  return (result.meta?.changes ?? 0) > 0;
}

export async function markOrderEmailSent(
  id: string,
  kind: "owner" | "customer"
): Promise<void> {
  const db = await getOrdersDb();
  const column = kind === "owner" ? "owner_email_status" : "customer_email_status";
  const claimedColumn = kind === "owner" ? "owner_email_claimed_at" : "customer_email_claimed_at";
  await db.prepare(
    `UPDATE orders SET ${column} = 'sent', ${claimedColumn} = NULL, email_last_error = NULL WHERE id = ?`
  ).bind(id).run();
}

export async function markOrderEmailFailed(id: string, error: string): Promise<void> {
  const db = await getOrdersDb();
  await db.prepare(
    "UPDATE orders SET owner_email_status = CASE WHEN owner_email_status = 'sending' THEN 'pending' ELSE owner_email_status END, customer_email_status = CASE WHEN customer_email_status = 'sending' THEN 'pending' ELSE customer_email_status END, owner_email_claimed_at = NULL, customer_email_claimed_at = NULL, email_last_error = ? WHERE id = ?"
  ).bind(error.slice(0, 1000), id).run();
}


export interface EmailOutboxItem {
  id: string;
  order_id: string;
  kind: "owner" | "customer";
  to_email: string;
  subject: string;
  html: string;
  status: "pending" | "sending" | "sent";
  attempts: number;
  next_attempt_at: number;
  locked_at: number | null;
  sent_at: number | null;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export async function enqueueOrderEmail(params: {
  id: string;
  orderId: string;
  kind: "owner" | "customer";
  toEmail: string;
  subject: string;
  html: string;
}): Promise<void> {
  const db = await getOrdersDb();
  const now = Date.now();

  await db.prepare(
    `INSERT INTO email_outbox (
       id, order_id, kind, to_email, subject, html, status,
       attempts, next_attempt_at, locked_at, sent_at, last_error, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?)
     ON CONFLICT(order_id, kind) DO UPDATE SET
       to_email = excluded.to_email,
       subject = excluded.subject,
       html = excluded.html,
       status = CASE WHEN email_outbox.status = 'sent' THEN 'sent' ELSE 'pending' END,
       next_attempt_at = CASE WHEN email_outbox.status = 'sent' THEN email_outbox.next_attempt_at ELSE excluded.next_attempt_at END,
       locked_at = CASE WHEN email_outbox.status = 'sending' THEN email_outbox.locked_at ELSE NULL END,
       last_error = CASE WHEN email_outbox.status = 'sent' THEN NULL ELSE email_outbox.last_error END,
       updated_at = excluded.updated_at`
  ).bind(
    params.id,
    params.orderId,
    params.kind,
    params.toEmail,
    params.subject,
    params.html,
    now,
    now,
    now
  ).run();
}

export async function getDueEmailOutbox(limit = 10): Promise<EmailOutboxItem[]> {
  const db = await getOrdersDb();
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  const now = Date.now();

  const result = await db.prepare(
    `SELECT * FROM email_outbox
     WHERE (status = 'pending' AND next_attempt_at <= ?)
        OR (status = 'sending' AND COALESCE(locked_at, 0) < ?)
     ORDER BY next_attempt_at ASC, created_at ASC
     LIMIT ?`
  ).bind(now, now - 10 * 60 * 1000, safeLimit).all<EmailOutboxItem>();

  return result.results ?? [];
}

export async function claimEmailOutbox(id: string): Promise<EmailOutboxItem | null> {
  const db = await getOrdersDb();
  const now = Date.now();

  const result = await db.prepare(
    `UPDATE email_outbox
     SET status = 'sending',
         attempts = attempts + 1,
         locked_at = ?,
         updated_at = ?
     WHERE id = ?
       AND (
         (status = 'pending' AND next_attempt_at <= ?)
         OR (status = 'sending' AND COALESCE(locked_at, 0) < ?)
       )`
  ).bind(now, now, id, now, now - 10 * 60 * 1000).run();

  if ((result.meta?.changes ?? 0) === 0) return null;

  return await db.prepare("SELECT * FROM email_outbox WHERE id = ?").bind(id).first<EmailOutboxItem>();
}

export async function markEmailOutboxSent(id: string): Promise<void> {
  const db = await getOrdersDb();
  const now = Date.now();

  const item = await db
    .prepare("SELECT order_id, kind FROM email_outbox WHERE id = ?")
    .bind(id)
    .first<{ order_id: string; kind: "owner" | "customer" }>();

  if (!item) return;

  const statusColumn = item.kind === "owner" ? "owner_email_status" : "customer_email_status";
  const claimedColumn = item.kind === "owner" ? "owner_email_claimed_at" : "customer_email_claimed_at";

  await db.batch([
    db.prepare(
      `UPDATE email_outbox
       SET status = 'sent', locked_at = NULL, sent_at = ?, last_error = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(now, now, id),
    db.prepare(
      `UPDATE orders
       SET ${statusColumn} = 'sent',
           ${claimedColumn} = NULL,
           email_last_error = NULL
       WHERE id = ? AND status = 'confirmed'`
    ).bind(item.order_id),
  ]);
}

export async function markEmailOutboxFailed(id: string, error: string): Promise<void> {
  const db = await getOrdersDb();
  const item = await db.prepare(
    "SELECT attempts, order_id, kind FROM email_outbox WHERE id = ?"
  ).bind(id).first<{ attempts: number; order_id: string; kind: "owner" | "customer" }>();

  const attempts = Number(item?.attempts ?? 1);
  const delayMs = Math.min(24 * 60 * 60 * 1000, 60 * 1000 * Math.pow(2, Math.min(attempts - 1, 10)));
  const nextAttemptAt = Date.now() + delayMs;

  const safeError = error.slice(0, 1000);

  await db.prepare(
    `UPDATE email_outbox
     SET status = 'pending',
         locked_at = NULL,
         next_attempt_at = ?,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`
  ).bind(nextAttemptAt, safeError, Date.now(), id).run();

  if (item) {
    const statusColumn = item.kind === "owner" ? "owner_email_status" : "customer_email_status";
    const claimedColumn = item.kind === "owner" ? "owner_email_claimed_at" : "customer_email_claimed_at";

    await db.prepare(
      `UPDATE orders
       SET ${statusColumn} = 'pending',
           ${claimedColumn} = NULL,
           email_last_error = ?
       WHERE id = ? AND status = 'confirmed'`
    ).bind(safeError, item.order_id).run();
  }
}
