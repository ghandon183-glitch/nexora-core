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
        tx_hash, download_token, created_at, expires_at, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      order.confirmed_at
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
  limit = 15
): Promise<Order[]> {
  const db = await getOrdersDb();
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  const stmt = currency
    ? db
        .prepare(
          "SELECT * FROM orders WHERE status = 'pending' AND currency = ? ORDER BY created_at ASC LIMIT ?"
        )
        .bind(currency, safeLimit)
    : db
        .prepare(
          "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?"
        )
        .bind(safeLimit);
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
       SET status = 'confirmed', tx_hash = ?, download_token = ?, confirmed_at = ?
       WHERE id = ? AND status = 'pending'`
    )
    .bind(txHash, downloadToken, Date.now(), id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
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
           download_token = ?, confirmed_at = ?
       WHERE id = ? AND status != 'confirmed'`
    )
    .bind(downloadToken, Date.now(), id)
    .run();

  return (result.meta?.changes ?? 0) > 0;
}
