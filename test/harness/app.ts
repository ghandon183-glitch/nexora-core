import { createHmac, randomUUID } from "node:crypto";

import { insertOrder, type Order } from "@/lib/orders/db";

import { createMigratedDatabase, type TestD1 } from "./d1";
import { resetMailer, testState } from "./state";

export const WEBHOOK_SECRET = "whsec_test_secret";
export const SITE_URL = "https://nexora.example";
export const OWNER_EMAIL = "owner@nexora.example";
export const CRON_SECRET = "cron_test_secret";
export const PAYMEGATE_ORDER_UUID = "5f1d3c9a-1111-4a2b-8c3d-111111111111";

export interface OrderRow extends Order {
  [key: string]: unknown;
}

export interface OutboxRow {
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
}

/** Fresh migrated in-memory database plus a deterministic environment. */
export function setupDatabase(): TestD1 {
  const db = createMigratedDatabase();

  testState.db = db;
  testState.env = {
    SITE_URL,
    NOTIFY_EMAIL: OWNER_EMAIL,
    PAYMEGATE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    PAYMEGATE_API_KEY: "paymegate_test_key",
    CRON_SECRET,
    GA_MEASUREMENT_ID: "",
  };

  resetMailer();

  return db;
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  const now = Date.now();

  return {
    id: randomUUID(),
    template_slug: "vesper",
    template_title: "Vesper",
    base_price_usd: 49,
    currency: "USDT",
    wallet_address: "",
    pay_amount: "49.00",
    buyer_name: "Buyer Name",
    buyer_email: "buyer@example.com",
    status: "pending",
    tx_hash: null,
    download_token: null,
    created_at: now,
    expires_at: now + 45 * 60 * 1000,
    confirmed_at: null,
    payment_provider: "paymegate",
    // Unique per order: migrations enforce a unique index on this column.
    paymegate_order_uuid: randomUUID(),
    paymegate_transaction_uuid: null,
    paymegate_transaction_ref: null,
    paymegate_event_id: null,
    ...overrides,
  };
}

export async function insertOrderRow(order: Order): Promise<Order> {
  await insertOrder(order);
  return order;
}

export function readOrder(db: TestD1, id: string): OrderRow {
  const row = db.database.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!row) throw new Error(`Order ${id} not found`);
  return row as OrderRow;
}

export function readOutbox(db: TestD1, orderId?: string): OutboxRow[] {
  const statement = orderId
    ? db.database.prepare("SELECT * FROM email_outbox WHERE order_id = ? ORDER BY kind")
    : db.database.prepare("SELECT * FROM email_outbox ORDER BY order_id, kind");

  const rows = (orderId ? statement.all(orderId) : statement.all()) as OutboxRow[];
  return rows;
}

export function signBody(rawBody: string, timestamp: string, secret = WEBHOOK_SECRET): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("base64url");
}

export interface WebhookOptions {
  timestamp?: number;
  secret?: string;
  signature?: string | null;
  eventIdHeader?: string;
}

/** Builds a signed webhook request exactly as Paymegate would deliver it. */
export function signedWebhookRequest(payload: unknown, options: WebhookOptions = {}): Request {
  const rawBody = JSON.stringify(payload);
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  const signature =
    options.signature === null
      ? null
      : (options.signature ?? signBody(rawBody, timestamp, options.secret ?? WEBHOOK_SECRET));

  const headers = new Headers({ "content-type": "application/json", "x-paymegate-timestamp": timestamp });
  if (signature !== null) headers.set("x-paymegate-signature", signature);
  if (options.eventIdHeader) headers.set("x-paymegate-event-id", options.eventIdHeader);

  return new Request("https://nexora.example/api/paymegate/webhook", {
    method: "POST",
    body: rawBody,
    headers,
  });
}

export interface PaidEvent {
  id: string;
  type: string;
  orderUUID: string;
  transactionUUID?: string;
  transactionRef?: string;
  status: string;
  amount: string;
  currency: string;
  customerEmail?: string;
  externalId?: string;
}

export function paidEvent(order: Order, overrides: Partial<PaidEvent> = {}): PaidEvent {
  return {
    id: `evt_${randomUUID()}`,
    type: "order.paid",
    orderUUID: order.paymegate_order_uuid ?? PAYMEGATE_ORDER_UUID,
    transactionUUID: "txn_test_uuid",
    transactionRef: "txn_test_ref",
    status: "PAID",
    amount: order.base_price_usd.toFixed(2),
    currency: "USD",
    customerEmail: order.buyer_email,
    externalId: order.id,
    ...overrides,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
