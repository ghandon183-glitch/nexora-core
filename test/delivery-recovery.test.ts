import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, test } from "node:test";

import { POST as adminConfirm } from "@/app/api/admin/orders/[id]/confirm/route";
import { POST as runPaymentCheck } from "@/app/api/cron/check-payments/route";
import { POST as notifyPurchase } from "@/app/api/notify-purchase/route";
import { enqueueOrderEmail } from "@/lib/orders/db";
import { processEmailOutbox } from "@/lib/orders/email-delivery";
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

/** 0.00048123 BTC == 48,123 satoshis. */
function btcOrder(overrides: Parameters<typeof makeOrder>[0] = {}) {
  return makeOrder({
    payment_provider: "crypto",
    paymegate_order_uuid: null,
    currency: "BTC",
    wallet_address: WALLETS.BTC.address,
    pay_amount: "0.00048123",
    ...overrides,
  });
}

/**
 * mempool.space reports `block_time` in seconds (unlike TronGrid, which
 * reports milliseconds), so these responses are built from epoch seconds to
 * pin the unit conversion down.
 */
function mempoolTxs(
  txs: { txid: string; blockTimeSeconds?: number; valueSats?: number }[]
): Response {
  return jsonResponse(
    txs.map((tx) => ({
      txid: tx.txid,
      vout: [{ scriptpubkey_address: WALLETS.BTC.address, value: tx.valueSats ?? 48123 }],
      status:
        tx.blockTimeSeconds === undefined
          ? { confirmed: false }
          : { confirmed: true, block_time: tx.blockTimeSeconds },
    }))
  );
}

function toBlockSeconds(ms: number): number {
  return Math.floor(ms / 1000);
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

function notifyRequest(body: unknown, ip = "unknown"): Request {
  return new Request("https://nexora.example/api/notify-purchase", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

/** Sends a raw body so structurally invalid JSON values can be exercised. */
function notifyRawRequest(rawBody: string, ip: string): Request {
  return new Request("https://nexora.example/api/notify-purchase", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: rawBody,
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

  test("a recycled amount fingerprint only ever fulfils the expired order that owns it", async () => {
    const now = Date.now();
    // Both orders quote the same 48.500000 USDT fingerprint: the partial unique
    // index only covers pending rows, so the expired amount is reusable.
    const expired = await insertOrderRow(
      cryptoOrder({
        status: "expired",
        created_at: now - 90 * 60 * 1000,
        expires_at: now - 30 * 60 * 1000,
      })
    );
    const reused = await insertOrderRow(
      cryptoOrder({ created_at: now - 20 * 60 * 1000, expires_at: now + 25 * 60 * 1000 })
    );

    // Transfer happened 5 minutes after the first order expired: inside its
    // late-payment window, but before the newer order existed.
    globalThis.fetch = async () => tronTransfers(now - 25 * 60 * 1000, "tron-fingerprint-tx");

    const { body } = await runCron();

    assert.equal(body.confirmed, 1);
    const fulfilled = readOrder(db, expired.id);
    assert.equal(fulfilled.status, "confirmed");
    assert.equal(fulfilled.tx_hash, "tron-fingerprint-tx");

    const untouched = readOrder(db, reused.id);
    assert.equal(untouched.status, "pending");
    assert.equal(untouched.download_token, null);
    assert.equal(readOutbox(db, reused.id).length, 0);

    // A later run must not move the same transaction onto the newer order.
    const second = await runCron();
    assert.equal(second.body.confirmed, 0);
    assert.equal(readOrder(db, reused.id).status, "pending");
    assert.equal(testState.mailerCalls.length, 2);
  });

  test("never confirms an on-chain transfer whose amount differs by a single micro-unit", async () => {
    const now = Date.now();
    const order = await insertOrderRow(
      cryptoOrder({ created_at: now - 60 * 1000, expires_at: now + 30 * 60 * 1000 })
    );

    globalThis.fetch = async () =>
      jsonResponse({
        data: [
          {
            transaction_id: "tron-wrong-amount",
            token_info: { address: USDT_CONTRACT },
            to: WALLETS.USDT.address,
            value: "48500001",
            block_timestamp: now - 30 * 1000,
          },
        ],
      });

    const { body } = await runCron();

    assert.equal(body.confirmed, 0);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db, order.id).length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("recovers a late BTC payment from mempool's seconds-based block_time", async () => {
    const now = Date.now();
    const expiresAt = now - 20 * 60 * 1000;
    const order = await insertOrderRow(
      btcOrder({ status: "expired", created_at: now - 60 * 60 * 1000, expires_at: expiresAt })
    );

    globalThis.fetch = async () =>
      mempoolTxs([{ txid: "btc-late-tx", blockTimeSeconds: toBlockSeconds(expiresAt + 5 * 60 * 1000) }]);

    const { body } = await runCron();

    assert.equal(body.confirmed, 1);
    assert.equal(body.emailsRetried, 2);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.equal(confirmed.tx_hash, "btc-late-tx");
    assert.ok(confirmed.download_token);
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("refuses a BTC transfer outside the late-payment window", async () => {
    const now = Date.now();
    const expiresAt = now - 2 * 60 * 60 * 1000;
    const order = await insertOrderRow(
      btcOrder({ status: "expired", created_at: now - 3 * 60 * 60 * 1000, expires_at: expiresAt })
    );

    globalThis.fetch = async () =>
      mempoolTxs([{ txid: "btc-too-late", blockTimeSeconds: toBlockSeconds(expiresAt + 2 * 60 * 60 * 1000) }]);

    const { body } = await runCron();

    assert.equal(body.confirmed, 0);
    assert.equal(readOrder(db, order.id).status, "expired");
    assert.equal(readOrder(db, order.id).download_token, null);
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("ignores a later same-amount BTC transfer when an in-window one proves the payment", async () => {
    const now = Date.now();
    const expiresAt = now - 30 * 60 * 1000;
    const order = await insertOrderRow(
      btcOrder({ status: "expired", created_at: now - 90 * 60 * 1000, expires_at: expiresAt })
    );

    // mempool.space lists the newest transaction first: an unrelated transfer
    // that reuses the amount sits outside the window, while the buyer's real
    // transfer is inside it. Only the in-window one may confirm the order.
    globalThis.fetch = async () =>
      mempoolTxs([
        { txid: "btc-reused-amount", blockTimeSeconds: toBlockSeconds(expiresAt + 90 * 60 * 1000) },
        { txid: "btc-real-in-window", blockTimeSeconds: toBlockSeconds(expiresAt + 3 * 60 * 1000) },
      ]);

    const { body } = await runCron();

    assert.equal(body.confirmed, 1);
    assert.equal(readOrder(db, order.id).tx_hash, "btc-real-in-window");
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("refuses an unconfirmed BTC transaction", async () => {
    const now = Date.now();
    const order = await insertOrderRow(
      btcOrder({
        status: "expired",
        created_at: now - 60 * 60 * 1000,
        expires_at: now - 20 * 60 * 1000,
      })
    );

    // A mempool-only transfer has no block_time and must never be credited.
    globalThis.fetch = async () => mempoolTxs([{ txid: "btc-unconfirmed" }]);

    const { body } = await runCron();

    assert.equal(body.confirmed, 0);
    assert.equal(readOrder(db, order.id).status, "expired");
    assert.equal(readOrder(db, order.id).tx_hash, null);
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

  test("recovers only a missing message and never rewrites a delivered one", async () => {
    globalThis.fetch = async () => jsonResponse({ data: [] });

    const partial: { id: string; kind: "owner" | "customer" }[] = [];
    for (const kind of ["owner", "customer"] as const) {
      const order = await insertOrderRow(
        makeOrder({
          status: "confirmed",
          download_token: randomUUID(),
          confirmed_at: Date.now() - 60 * 1000,
        })
      );
      // Mirrors a real confirmation (`markOrderConfirmed` sets both statuses
      // pending) followed by an outbox write that only queued one kind.
      db.database
        .prepare(
          "UPDATE orders SET owner_email_status = 'pending', customer_email_status = 'pending' WHERE id = ?"
        )
        .run(order.id);

      await enqueueOrderEmail({
        id: `${order.id}:${kind}`,
        orderId: order.id,
        kind,
        toEmail: kind === "owner" ? OWNER_EMAIL : order.buyer_email,
        subject: `pre-existing ${kind}`,
        html: `<p>pre-existing ${kind}</p>`,
      });
      partial.push({ id: order.id, kind });
    }

    // Only one of the two required messages was ever queued for each order.
    const firstDrain = await processEmailOutbox(10);
    assert.equal(firstDrain.sent, 2);
    assert.equal(testState.mailerCalls.length, 2);

    const delivered = readOutbox(db).filter((row) => row.status === "sent");
    assert.equal(delivered.length, 2);

    const { body } = await runCron();

    assert.equal(body.ordersRequeued, 2);
    assert.equal(body.emailsRetried, 2);

    for (const entry of partial) {
      const rows = readOutbox(db, entry.id);
      assert.equal(rows.length, 2, "each confirmed order ends up with both messages");
      assert.equal(rows.every((row) => row.status === "sent"), true);
    }

    // Recovery is create-only: an already-sent row keeps its wording, attempt
    // count and sent timestamp instead of being reset and re-sent.
    for (const row of delivered) {
      const after = readOutbox(db).find((candidate) => candidate.id === row.id);
      assert.ok(after);
      assert.equal(after.status, "sent");
      assert.equal(after.attempts, row.attempts);
      assert.equal(after.sent_at, row.sent_at);
      assert.equal(after.subject, row.subject);
      assert.equal(after.html, row.html);
    }

    const recovered = testState.mailerCalls.slice(2);
    assert.equal(recovered.length, 2);
    assert.ok(
      recovered.every((call) => !call.subject.startsWith("pre-existing")),
      "only the missing, real delivery message is sent"
    );

    const again = await runCron();
    assert.equal(again.body.ordersRequeued, 0);
    assert.equal(again.body.emailsRetried, 0);
    assert.equal(testState.mailerCalls.length, 4);
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
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
    testState.env = { ...testState.env, RESEND_API_KEY: "resend_test_key" };
  });

  test("rejects a JSON null body without reading properties off it", async () => {
    const response = await notifyPurchase(notifyRawRequest("null", "malformed-null"));

    assert.equal(response.status, 400);
    assert.equal(testState.resendCalls.length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("rejects an array body even when it contains valid-looking fields", async () => {
    const order = await insertOrderRow(cryptoOrder());

    const response = await notifyPurchase(
      notifyRawRequest(
        JSON.stringify([{ orderId: order.id, buyerEmail: order.buyer_email }]),
        "malformed-array"
      )
    );

    assert.equal(response.status, 400);
    assert.equal(testState.resendCalls.length, 0);
    assert.equal(testState.mailerCalls.length, 0);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("rejects primitive JSON bodies", async () => {
    const primitives = ["\"order-id\"", "42", "true"];

    for (const [index, raw] of primitives.entries()) {
      const response = await notifyPurchase(
        notifyRawRequest(raw, `malformed-primitive-${index}`)
      );
      assert.equal(response.status, 400, `primitive body ${raw} must be rejected`);
    }

    assert.equal(testState.resendCalls.length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("does not report a successful owner notification when Resend returns an error", async () => {
    const order = await insertOrderRow(cryptoOrder());
    testState.resendError = { name: "validation_error", statusCode: 422 };

    const response = await notifyPurchase(
      notifyRequest({ orderId: order.id, buyerEmail: order.buyer_email })
    );
    const body = (await response.json()) as {
      ownerEmailSent?: boolean;
      customerEmailSent?: boolean;
    };

    assert.equal(response.status, 200);
    assert.equal(body.ownerEmailSent, false);
    assert.equal(body.customerEmailSent, true);
    assert.equal(testState.resendCalls.length, 1, "the rejected attempt is still recorded");
    assert.equal(testState.mailerCalls.length, 1, "the buyer acknowledgement is unaffected");
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
