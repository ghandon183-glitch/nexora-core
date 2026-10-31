import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { POST as runPaymentCheck } from "@/app/api/cron/check-payments/route";
import { WALLETS } from "@/lib/orders/pricing";

import {
  CRON_SECRET,
  insertOrderRow,
  makeOrder,
  readOrder,
  readOutbox,
  setupDatabase,
} from "./harness/app";
import type { TestD1 } from "./harness/d1";
import { testState } from "./harness/state";

const originalFetch = globalThis.fetch;

interface CronResponse {
  ok: boolean;
  confirmed: number;
  expired: number;
  review: number;
  paymegateChecked: number;
  paymegateErrors: string[];
  errors: string[];
  emailsRetried: number;
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

function paymegateOrder(orderId: string, overrides: Record<string, unknown> = {}) {
  return {
    data: {
      order: {
        status: "PAID",
        amount: "49.00",
        currency: "USD",
        customerEmail: "buyer@example.com",
        externalId: orderId,
        transactionUUID: "provider-txn-uuid",
        transactionRef: "provider-txn-ref",
        ...overrides,
      },
    },
  };
}

describe("Payment reconciliation cron", () => {
  let db: TestD1;
  let requestedUrls: string[];

  beforeEach(() => {
    db = setupDatabase();
    requestedUrls = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("rejects requests without the cron secret", async () => {
    const response = await runPaymentCheck(cronRequest(null));

    assert.equal(response.status, 401);
  });

  test("confirms a Paymegate payment that arrived after local expiry and sends both emails", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    globalThis.fetch = async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input));
      return jsonResponse(paymegateOrder(order.id));
    };

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(response.status, 200);
    assert.equal(body.confirmed, 1);
    assert.equal(body.paymegateChecked, 1);
    assert.deepEqual(body.paymegateErrors, []);
    assert.equal(body.emailsRetried, 2);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok(confirmed.download_token);
    assert.equal(confirmed.paymegate_transaction_ref, "provider-txn-ref");
    assert.equal(confirmed.paymegate_event_id, `poll:${order.paymegate_order_uuid}`);

    const outbox = readOutbox(db, order.id);
    assert.equal(outbox.length, 2);
    assert.equal(outbox.every((row) => row.status === "sent"), true);
    assert.equal(testState.mailerCalls.length, 2);
    // The owner alert must name the real payment source.
    const ownerMail = testState.mailerCalls.find((call) => call.to.includes("owner"));
    assert.ok(ownerMail);
    assert.match(ownerMail.subject, /NEXORA SALE/);
    assert.match(ownerMail.html, /Paymegate/);
    assert.ok(requestedUrls.some((url) => url.startsWith("https://api.paymegate.com/")));
  });

  test("never fulfils a paid order whose amount does not match the local order", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    globalThis.fetch = async () => jsonResponse(paymegateOrder(order.id, { amount: "1.00" }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 0);
    assert.equal(body.paymegateErrors.length, 1);
    assert.match(body.paymegateErrors[0], /correlation/);

    const unchanged = readOrder(db, order.id);
    assert.equal(unchanged.status, "expired");
    assert.equal(unchanged.download_token, null);
    assert.equal(readOutbox(db, order.id).length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("never fulfils a paid order for a different customer email", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    globalThis.fetch = async () =>
      jsonResponse(paymegateOrder(order.id, { customerEmail: "someone-else@example.com" }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 0);
    assert.equal(readOrder(db, order.id).status, "expired");
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("expires a pending Paymegate order the provider cancelled", async () => {
    const order = await insertOrderRow(makeOrder());

    globalThis.fetch = async () => jsonResponse(paymegateOrder(order.id, { status: "CANCELLED" }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.expired, 1);
    assert.equal(readOrder(db, order.id).status, "expired");
  });

  test("confirms a matching on-chain USDT transfer and labels the source as cryptocurrency", async () => {
    const now = Date.now();
    const order = await insertOrderRow(
      makeOrder({
        payment_provider: "crypto",
        paymegate_order_uuid: null,
        currency: "USDT",
        wallet_address: WALLETS.USDT.address,
        pay_amount: "48.500000",
        created_at: now,
        expires_at: now + 30 * 60 * 1000,
      })
    );

    globalThis.fetch = async () =>
      jsonResponse({
        data: [
          {
            transaction_id: "tron-tx-1",
            token_info: { address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" },
            to: WALLETS.USDT.address,
            value: "48500000",
            block_timestamp: now + 5_000,
          },
        ],
      });

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 1);
    assert.equal(body.emailsRetried, 2);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.equal(confirmed.tx_hash, "tron-tx-1");

    const ownerMail = testState.mailerCalls.find((call) => call.to.includes("owner"));
    assert.ok(ownerMail);
    assert.match(ownerMail.html, /cryptocurrency/);
    assert.doesNotMatch(ownerMail.html, /Paymegate/);
  });

  test("expires an unmatched crypto order after its checkout window", async () => {
    const now = Date.now();
    const order = await insertOrderRow(
      makeOrder({
        payment_provider: "crypto",
        paymegate_order_uuid: null,
        currency: "USDT",
        wallet_address: WALLETS.USDT.address,
        pay_amount: "48.500000",
        created_at: now - 2 * 60 * 60 * 1000,
        expires_at: now - 60 * 60 * 1000,
      })
    );

    globalThis.fetch = async () => jsonResponse({ data: [] });

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.expired, 1);
    assert.equal(readOrder(db, order.id).status, "expired");
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("moves an order to manual review when the on-chain lookup fails", async () => {
    const order = await insertOrderRow(
      makeOrder({
        payment_provider: "crypto",
        paymegate_order_uuid: null,
        currency: "USDT",
        wallet_address: WALLETS.USDT.address,
        pay_amount: "48.500000",
      })
    );

    globalThis.fetch = async () => jsonResponse({ error: "upstream down" }, 503);

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.review, 1);
    assert.equal(body.errors.length, 1);
    const reviewed = readOrder(db, order.id);
    assert.equal(reviewed.status, "review");
    assert.equal(reviewed.download_token, null);
  });

  test("fulfils a paid order when the provider response omits the customer email", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    // The order is already bound by provider UUID, external id and amount, so an
    // absent email is not evidence against the payment (same rule as the webhook).
    globalThis.fetch = async () =>
      jsonResponse(paymegateOrder(order.id, { customerEmail: null }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 1);
    assert.deepEqual(body.paymegateErrors, []);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok(confirmed.download_token);
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("fulfils a paid order whose provider amount is formatted as 49.0", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    globalThis.fetch = async () =>
      jsonResponse(paymegateOrder(order.id, { amount: "49.0", externalId: null }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 1);
    assert.equal(readOrder(db, order.id).status, "confirmed");
  });

  test("still refuses a provider amount with sub-cent precision", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    globalThis.fetch = async () => jsonResponse(paymegateOrder(order.id, { amount: "49.004" }));

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.confirmed, 0);
    assert.equal(body.paymegateErrors.length, 1);
    assert.equal(readOrder(db, order.id).status, "expired");
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("confirms nothing when the provider lookup itself fails", async () => {
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: Date.now() - 60 * 60 * 1000 })
    );

    // A temporary provider outage must surface as an error and a retry on the
    // next run, never as a confirmation of an unpaid order.
    globalThis.fetch = async () => jsonResponse({ error: "provider down" }, 500);

    const response = await runPaymentCheck(cronRequest());
    const body = (await response.json()) as CronResponse;

    assert.equal(body.ok, true);
    assert.equal(body.confirmed, 0);
    assert.equal(body.paymegateErrors.length, 1);

    const unchanged = readOrder(db, order.id);
    assert.equal(unchanged.status, "expired");
    assert.equal(unchanged.download_token, null);
    assert.equal(readOutbox(db, order.id).length, 0);
    assert.equal(testState.mailerCalls.length, 0);
  });
});
