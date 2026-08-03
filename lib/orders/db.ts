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

/**
 * Returns the D1 binding.
 *
 * In local `next dev`, Cloudflare bindings aren't available — every function
 * below fails loudly with a clear message rather than silently no-op'ing,
 * so a missing binding is never mistaken for "no orders yet".
 */
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

export async function getPendingOrders(
  currency?: "USDT" | "BTC"
): Promise<Order[]> {
  const db = await getOrdersDb();

  const stmt = currency
    ? db
        .prepare("SELECT * FROM orders WHERE status = 'pending' AND currency = ?")
        .bind(currency)
    : db.prepare("SELECT * FROM orders WHERE status = 'pending'");

  const result = await stmt.all<Order>();

  return result.results ?? [];
}

export async function getRecentOrders(limit = 100): Promise<Order[]> {
  const db = await getOrdersDb();

  const result = await db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<Order>();

  return result.results ?? [];
}

export async function markOrderConfirmed(
  id: string,
  txHash: string,
  downloadToken: string
): Promise<void> {
  const db = await getOrdersDb();

  await db
    .prepare(
      `UPDATE orders
       SET status = 'confirmed', tx_hash = ?, download_token = ?, confirmed_at = ?
       WHERE id = ?`
    )
    .bind(txHash, downloadToken, Date.now(), id)
    .run();
}

export async function markOrderExpired(id: string): Promise<void> {
  const db = await getOrdersDb();

  await db
    .prepare("UPDATE orders SET status = 'expired' WHERE id = ?")
    .bind(id)
    .run();
}

export async function markOrderReview(id: string): Promise<void> {
  const db = await getOrdersDb();

  await db
    .prepare("UPDATE orders SET status = 'review' WHERE id = ?")
    .bind(id)
    .run();
}

/** Manual override for the admin panel — confirms an order by hand. */
export async function adminForceConfirm(
  id: string,
  downloadToken: string
): Promise<void> {
  const db = await getOrdersDb();

  await db
    .prepare(
      `UPDATE orders
       SET status = 'confirmed', tx_hash = COALESCE(tx_hash, 'manual-admin-override'),
           download_token = ?, confirmed_at = ?
       WHERE id = ?`
    )
    .bind(downloadToken, Date.now(), id)
    .run();
}
