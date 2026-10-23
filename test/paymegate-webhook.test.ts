import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import { POST } from "@/app/api/paymegate/webhook/route";
import type { Order } from "@/lib/orders/db";

import {
  PAYMEGATE_ORDER_UUID,
  insertOrderRow,
  makeOrder,
  paidEvent,
  readOrder,
  readOutbox,
  setupDatabase,
  signedWebhookRequest,
} from "./harness/app";
import type { TestD1 } from "./harness/d1";
import { testState } from "./harness/state";

describe("Paymegate webhook", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
  });

  test("rejects a request without a signature", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(signedWebhookRequest(paidEvent(order), { signature: null }));

    assert.equal(response.status, 401);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db).length, 0);
  });

  test("rejects a signature produced with the wrong secret", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(signedWebhookRequest(paidEvent(order), { secret: "wrong_secret" }));

    assert.equal(response.status, 401);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("rejects a replayed timestamp outside the allowed clock skew", async () => {
    const order = await insertOrderRow(makeOrder());
    const staleTimestamp = Math.floor(Date.now() / 1000) - 10 * 60;

    const response = await POST(signedWebhookRequest(paidEvent(order), { timestamp: staleTimestamp }));

    assert.equal(response.status, 401);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("returns 503 when the webhook secret is not configured", async () => {
    const order = await insertOrderRow(makeOrder());
    testState.env = { ...testState.env, PAYMEGATE_WEBHOOK_SECRET: undefined };

    const response = await POST(signedWebhookRequest(paidEvent(order)));

    assert.equal(response.status, 503);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("confirms a correlated paid event and queues both emails", async () => {
    const order = await insertOrderRow(makeOrder());
    const event = paidEvent(order);

    const response = await POST(signedWebhookRequest(event));
    const body = (await response.json()) as { processed?: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.processed, true);

    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok(confirmed.download_token, "a download token must be issued");
    assert.equal(confirmed.confirmed_at !== null, true);
    assert.equal(confirmed.paymegate_event_id, event.id);
    assert.equal(confirmed.paymegate_transaction_uuid, "txn_test_uuid");

    const outbox = readOutbox(db, order.id);
    assert.equal(outbox.length, 2);
    const owner = outbox.find((row) => row.kind === "owner");
    const customer = outbox.find((row) => row.kind === "customer");
    assert.ok(owner && customer, "owner and customer messages must be queued");
    assert.equal(owner.status, "pending");
    assert.equal(customer.status, "pending");
    assert.match(owner.subject, /NEXORA SALE/);
    // Truthful payment-source labelling: a card/PayPal sale must not claim crypto.
    assert.match(owner.html, /Paymegate/);
    assert.doesNotMatch(owner.html, /cryptocurrency/);
    assert.ok(customer.html.includes(confirmed.download_token as string));
    // Webhook only queues mail; it must never send inline.
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("a duplicate event never rotates the token or duplicates outbox rows", async () => {
    const order = await insertOrderRow(makeOrder());
    const event = paidEvent(order);

    await POST(signedWebhookRequest(event));
    const first = readOrder(db, order.id);

    const duplicate = await POST(signedWebhookRequest(event));
    const body = (await duplicate.json()) as { duplicate?: boolean };
    const second = readOrder(db, order.id);

    assert.equal(duplicate.status, 200);
    assert.equal(body.duplicate, true);
    assert.equal(second.download_token, first.download_token);
    assert.equal(second.confirmed_at, first.confirmed_at);
    assert.equal(readOutbox(db, order.id).length, 2);
    assert.equal(testState.mailerCalls.length, 0);
  });

  test("a different event for an already confirmed order still keeps one message per kind", async () => {
    const order = await insertOrderRow(makeOrder());

    await POST(signedWebhookRequest(paidEvent(order)));
    const afterFirst = readOrder(db, order.id);

    const replayWithNewEventId = await POST(
      signedWebhookRequest(paidEvent(order, { id: "evt_second_delivery" }))
    );

    assert.equal(replayWithNewEventId.status, 200);
    const afterSecond = readOrder(db, order.id);
    assert.equal(afterSecond.download_token, afterFirst.download_token);
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("rejects an amount that differs from the order price", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(signedWebhookRequest(paidEvent(order, { amount: "1.00" })));

    assert.equal(response.status, 409);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db).length, 0);
  });

  test("rejects a non-USD currency", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(signedWebhookRequest(paidEvent(order, { currency: "EUR" })));

    assert.equal(response.status, 409);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("rejects a customer email that does not match the order", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(
      signedWebhookRequest(paidEvent(order, { customerEmail: "attacker@example.com" }))
    );

    assert.equal(response.status, 409);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db).length, 0);
  });

  test("rejects an externalId that belongs to a different order", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(
      signedWebhookRequest(paidEvent(order, { externalId: "00000000-0000-4000-8000-000000000000" }))
    );

    assert.equal(response.status, 409);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("confirms a payment that arrives after the local checkout window expired", async () => {
    const now = Date.now();
    const order = await insertOrderRow(
      makeOrder({ status: "expired", expires_at: now - 60 * 60 * 1000 })
    );

    const response = await POST(signedWebhookRequest(paidEvent(order)));
    const body = (await response.json()) as { processed?: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.processed, true);
    const confirmed = readOrder(db, order.id);
    assert.equal(confirmed.status, "confirmed");
    assert.ok(confirmed.download_token);
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("ignores events for unknown provider orders", async () => {
    const event = paidEvent(makeOrder(), { orderUUID: "unknown-provider-order", externalId: undefined });

    const response = await POST(signedWebhookRequest(event));
    const body = (await response.json()) as { ignored?: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.ignored, true);
    assert.equal(readOutbox(db).length, 0);
  });

  test("ignores events that are not a paid order", async () => {
    const order = await insertOrderRow(makeOrder());

    const response = await POST(
      signedWebhookRequest(paidEvent(order, { type: "order.created", status: "PENDING" }))
    );
    const body = (await response.json()) as { ignored?: boolean };

    assert.equal(response.status, 200);
    assert.equal(body.ignored, true);
    assert.equal(readOrder(db, order.id).status, "pending");
  });

  test("rejects a stale duplicate event for an unknown order without side effects", async () => {
    const order = await insertOrderRow(makeOrder({ status: "review" }));

    const response = await POST(signedWebhookRequest(paidEvent(order)));

    assert.equal(response.status, 409);
    const unchanged = readOrder(db, order.id);
    assert.equal(unchanged.status, "review");
    assert.equal(unchanged.download_token, null);
    assert.equal(readOutbox(db, order.id).length, 0);
  });

  test("orders created by the crypto flow are not confirmed by provider events", async () => {
    const order = await insertOrderRow(
      makeOrder({
        payment_provider: "crypto",
        currency: "USDT",
        wallet_address: "TTs2YMrifwWhiEPWVxhqqHd7v5DZNu477R",
        pay_amount: "47.990123",
      })
    );

    const response = await POST(
      signedWebhookRequest(
        paidEvent(order, { orderUUID: PAYMEGATE_ORDER_UUID, externalId: order.id })
      )
    );

    assert.equal(response.status, 200);
    assert.equal(readOrder(db, order.id).status, "pending");
    assert.equal(readOutbox(db).length, 0);
  });

  test("a D1 failure while queueing the emails fails the delivery and is healed by provider retry", async () => {
    const order = await insertOrderRow(makeOrder());
    const event = paidEvent(order);

    // Confirmation is persisted before the outbox write; a database error on
    // that write must surface as 500 so Paymegate re-delivers the event.
    db.database.exec(
      "CREATE TRIGGER fail_outbox BEFORE INSERT ON email_outbox BEGIN SELECT RAISE(ABORT, 'D1 write failure'); END;"
    );

    const failed = await POST(signedWebhookRequest(event));

    assert.equal(failed.status, 500);
    const afterFailure = readOrder(db, order.id);
    assert.equal(afterFailure.status, "confirmed");
    assert.ok(afterFailure.download_token, "the paid order must keep its entitlement");
    assert.equal(readOutbox(db, order.id).length, 0);

    db.database.exec("DROP TRIGGER fail_outbox");

    const retry = await POST(signedWebhookRequest(event));
    const retryBody = (await retry.json()) as { duplicate?: boolean };

    assert.equal(retry.status, 200);
    assert.equal(retryBody.duplicate, true);
    assert.equal(readOutbox(db, order.id).length, 2);
    assert.equal(testState.mailerCalls.length, 0);

    // Replaying the event again still produces exactly one message per kind.
    await POST(signedWebhookRequest(event));
    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("accepts a signature sent in the t=,v1= header format", async () => {
    const order = await insertOrderRow(makeOrder());
    const event: Order = order;
    const rawBody = JSON.stringify(paidEvent(event));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { createHmac } = await import("node:crypto");
    const signature = createHmac("sha256", "whsec_test_secret")
      .update(`${timestamp}.${rawBody}`, "utf8")
      .digest("base64url");

    const request = new Request("https://nexora.example/api/paymegate/webhook", {
      method: "POST",
      body: rawBody,
      headers: {
        "content-type": "application/json",
        "x-paymegate-timestamp": timestamp,
        "x-paymegate-signature": `t=${timestamp},v1=${signature}`,
      },
    });

    const response = await POST(request);

    assert.equal(response.status, 200);
    assert.equal(readOrder(db, order.id).status, "confirmed");
  });
});
