import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, test } from "node:test";

import { POST as adminConfirm } from "@/app/api/admin/orders/[id]/confirm/route";
import { POST as runPaymentCheck } from "@/app/api/cron/check-payments/route";
import { POST as notifyPurchase } from "@/app/api/notify-purchase/route";
import { WALLETS } from "@/lib/orders/pricing";

import {
  CRON_SECRET,
  OWNER_EMAIL,
  insertOrderRow,
  makeOrder,
  readOrder,
  readOutbox,
  setupDatabase,
} from "./harness/app";
import type { TestD1 } from "./harness/d1";
import { testState } from "./harness/state";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const ADMIN_PASSWORD = "admin_test_password";
const originalFetch = globalThis.fetch;

interface CronResponse {
  ok: boolean;
  confirmed: number;
  expired: number;
  review: number;
  checked: number;
  paymegateChecked: number;
  lateCryptoChecked: number;
  ordersRequeued: number;
  emailsRetried: number;
  paymegateErrors: string[];
  errors: string[];
  emailOutbox: { claimed: number; sent: number; failed: number };
}

function cronRequest(secret: string | null = CRON_SECRET): Request {
  const headers = new Headers();
  if (secret !== null) headers.set("x-cron-secret", secret);
  return new Request("https://nexora.example/api/cron/check-payments", { method: "POST", headers });
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function tronTransfers(blockTimestamp: number, transactionId: string): Response {
  return jsonResponse({
    data: [
      {
        transaction_id: transactionId,
        token_info: { address: USDT_CONTRACT },
        to: WALLETS.USDT.address,
        value: "48500000",
        block_timestamp: blockTimestamp,
      },
    ],
  });
}

function cryptoOrder(overrides: Parameters<typeof makeOrder>[0] = {}) {
  return makeOrder({
    payment_provider: "crypto",
    paymegate_order_uuid: null,
    currency: "USDT",
    wallet_address: WALLETS.USDT.address,
    pay_amount: "48.500000",
    ...overrides,
  });
}

async function runCron(): Promise<{ response: Response; body: CronResponse }> {
  const response = await runPaymentCheck(cronRequest());
  return { response, body: (await response.json()) as CronResponse };
}

function adminSessionToken(): string {
  const payload = `v1.${Math.floor(Date.now() / 1000) + 3600}`;
  const signature = createHmac("sha256", ADMIN_PASSWORD).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function adminRequest(orderId: string): Request {
  return new Request(`https://nexora.example/api/admin/orders/${orderId}/confirm`, {
    method: "POST",
  });
}

function notifyRequest(body: unknown): Request {
  return new Request("https://nexora.example/api/notify-purchase", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Late crypto payment recovery", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("fulfils exactly once a transfer broadcast just before local expiry but indexed afterwards", async () => {
    const now = Date.now();
    const expiresAt = now - 30 * 60 * 1000;
    const order = await insertOrderRow(
      cryptoOrder({
        status: "expired",
        created_at: now - 75 * 60 * 1000,
        expires_at: expiresAt,
      })
    );

    globalThis.fetch = async () => tronTransfers(expiresAt + 5 * 60 * 1000, "tron-late-tx");

    const { response, body } = await runCron();

    assert.equal(response.status, 200);
    assert.equal(body.lateCryptoChecked, 1);
    assert.equal(body.confirmed, 1);
    assert.equal(body.emailsRetried, 2);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.equal(confirmed.tx_hash, "tron-late-tx");
    assert.ok(confirmed.download_token);

    const outbox = readOutbox(db, order.id);
    assert.equal(outbox.length, 2);
    assert.equal(outbox.every((row) => row.status === "sent"), true);
    assert.equal(testState.mailerCalls.length, 2);

    // A second run must not re-fulfil or re-email the recovered payment.
    const second = await runCron();
    assert.equal(second.body.confirmed, 0);
    assert.equal(testState.mailerCalls.length, 2);
  });

  test("refuses an expired order whose only on-chain match is far outside the late-payment window", async () => {
    const now = Date.now();
    const expiresAt = now - 60 * 60 * 1000;
    const order = await insertOrderRow(
      cryptoOrder({ status: "expired", created_at: now - 3 * 60 * 60 * 1000, expires_at: expiresAt })
    );

    globalThis.fetch = async () => tronTransfers(expiresAt + 2 * 60 * 60 * 1000, "tron-too-late");

    const { body } = await runCron();

    assert.equal(body.confirmed, 0);
    const unchanged = readOrder(db, order.id);
    assert.equal(unchanged.status, "expired");
    assert.equal(unchanged.download_token, null);
    assert.equal(readOutbox(db, order.id).length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("one on-chain transaction can never confirm two orders", async () => {
    const now = Date.now();
    await insertOrderRow(
      cryptoOrder({
        status: "confirmed",
        tx_hash: "tron-reused-tx",
        download_token: randomUUID(),
        confirmed_at: now - 10 * 60 * 1000,
      })
    );

    const second = await insertOrderRow(
      cryptoOrder({ status: "pending", created_at: now - 5 * 60 * 1000, expires_at: now + 40 * 60 * 1000 })
    );

    globalThis.fetch = async () => tronTransfers(now - 4 * 60 * 1000, "tron-reused-tx");

    const { body } = await runCron();

    assert.equal(body.confirmed, 0);
    const pending = readOrder(db, second.id);
    assert.equal(pending.status, "pending");
    assert.equal(pending.download_token, null);
    assert.equal(readOutbox(db, second.id).length, 0);
  });
});

describe("Confirmed order delivery recovery", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("re-queues and delivers an email queue that was lost after the order was confirmed", async () => {
    const token = randomUUID();
    const order = await insertOrderRow(
      makeOrder({
        status: "confirmed",
        download_token: token,
        confirmed_at: Date.now() - 2 * 60 * 1000,
      })
    );
    // Mirrors a confirmation whose outbox INSERT failed (D1 error / worker
    // shutdown): the order is paid, but no message exists yet.
    db.database
      .prepare(
        "UPDATE orders SET owner_email_status = 'pending', customer_email_status = 'pending' WHERE id = ?"
      )
      .run(order.id);

    globalThis.fetch = async () => jsonResponse({ data: [] });

    const { body } = await runCron();

    assert.equal(body.ordersRequeued, 1);
    assert.equal(body.emailsRetried, 2);

    const outbox = readOutbox(db, order.id);
    assert.equal(outbox.length, 2);
    assert.equal(outbox.every((row) => row.status === "sent"), true);

    const customerMail = testState.mailerCalls.find((call) => call.to === order.buyer_email);
    assert.ok(customerMail, "the customer must receive the download email");
    assert.ok(customerMail.html.includes(token), "the email must carry the real download token");

    const again = await runCron();
    assert.equal(again.body.ordersRequeued, 0);
    assert.equal(again.body.emailsRetried, 0);
    assert.equal(testState.mailerCalls.length, 2);
  });

  test("never invents delivery for a confirmed row that has no download token", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "confirmed", download_token: null, confirmed_at: Date.now() })
    );
    db.database
      .prepare(
        "UPDATE orders SET owner_email_status = 'pending', customer_email_status = 'pending' WHERE id = ?"
      )
      .run(order.id);

    globalThis.fetch = async () => jsonResponse({ data: [] });

    const { body } = await runCron();

    assert.equal(body.ordersRequeued, 0);
    assert.equal(readOutbox(db, order.id).length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });
});

describe("Manual admin confirmation", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
    testState.env = { ...testState.env, ADMIN_PASSWORD };
  });

  test("rejects an unauthenticated confirmation without touching the order", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await adminConfirm(adminRequest(order.id), {
      params: Promise.resolve({ id: order.id }),
    });

    assert.equal(response.status, 401);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("queues both emails through the outbox and stays idempotent", async () => {
    const order = await insertOrderRow(makeOrder());
    testState.adminSession = adminSessionToken();

    const response = await adminConfirm(adminRequest(order.id), {
      params: Promise.resolve({ id: order.id }),
    });

    assert.equal(response.status, 200);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok(confirmed.download_token);
    assert.equal(confirmed.owner_email_status, "sent");
    assert.equal(confirmed.customer_email_status, "sent");

    const outbox = readOutbox(db, order.id);
    assert.equal(outbox.length, 2);
    assert.equal(testState.mailerCalls.length, 2);

    const ownerMail = testState.mailerCalls.find((call) => call.to === OWNER_EMAIL);
    assert.ok(ownerMail, "manual confirmations must alert the owner too");
    assert.match(ownerMail.html, /confirmed manually by an authenticated administrator/);
    assert.doesNotMatch(ownerMail.html, /validating the on-chain transaction/);

    const repeat = await adminConfirm(adminRequest(order.id), {
      params: Promise.resolve({ id: order.id }),
    });
    const repeatBody = (await repeat.json()) as { alreadyConfirmed?: boolean };

    assert.equal(repeat.status, 200);
    assert.equal(repeatBody.alreadyConfirmed, true);
    assert.equal(readOutbox(db, order.id).length, 2);
    assert.equal(testState.mailerCalls.length, 2);
  });
});

describe("Purchase notification", () => {
  beforeEach(() => {
    setupDatabase();
    testState.env = { ...testState.env, RESEND_API_KEY: "resend_test_key" };
  });

  test("refuses to email a buyer address that does not belong to the order", async () => {
    const order = await insertOrderRow(cryptoOrder());

    const response = await notifyPurchase(
      notifyRequest({ orderId: order.id, buyerEmail: "attacker@example.com" })
    );

    assert.equal(response.status, 404);
    assert.equal(testState.resendCalls.length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("refuses an order id that does not exist", async () => {
    const response = await notifyPurchase(
      notifyRequest({ orderId: randomUUID(), buyerEmail: "buyer@example.com" })
    );

    assert.equal(response.status, 404);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("notifies only the stored order's buyer and escapes its fields", async () => {
    const order = await insertOrderRow(
      cryptoOrder({ buyer_name: "<script>alert(1)</script>", buyer_email: "buyer@example.com" })
    );

    const response = await notifyPurchase(
      notifyRequest({ orderId: order.id, buyerEmail: " BUYER@example.com " })
    );

    assert.equal(response.status, 200);
    assert.equal(testState.resendCalls.length, 1);
    assert.equal(testState.resendCalls[0].to, OWNER_EMAIL);
    assert.equal(testState.mailerCalls.length, 1);
    assert.equal(testState.mailerCalls[0].to, order.buyer_email);
    assert.ok(testState.mailerCalls[0].html.includes("&lt;script&gt;"));
    assert.ok(!testState.mailerCalls[0].html.includes("<script>"));
  });

  test("does not send a second acknowledgement once the order is confirmed", async () => {
    const order = await insertOrderRow(
      cryptoOrder({ status: "confirmed", download_token: randomUUID(), confirmed_at: Date.now() })
    );

    const response = await notifyPurchase(
      notifyRequest({ orderId: order.id, buyerEmail: order.buyer_email })
    );
    const body = (await response.json()) as { skipped?: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.skipped, true);
    assert.equal(testState.resendCalls.length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });
});
