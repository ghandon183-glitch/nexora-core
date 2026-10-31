import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, test } from "node:test";

import { POST as startPaymegateCheckout } from "@/app/api/paymegate/create/route";
import { insertOrder, type Order } from "@/lib/orders/db";
import { WALLETS } from "@/lib/orders/pricing";

import { setupDatabase } from "./harness/app";
import type { TestD1 } from "./harness/d1";

const originalFetch = globalThis.fetch;
const TEMPLATE_SLUG = "modern-saas";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function checkoutRequest(verificationId: string, email: string, ip: string): Request {
  return new Request("https://nexora.example/api/paymegate/create", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify({
      templateSlug: TEMPLATE_SLUG,
      buyerName: "Buyer Name",
      buyerEmail: email,
      verificationId,
    }),
  });
}

async function verifiedEmail(db: TestD1, email: string): Promise<string> {
  const id = randomUUID();
  const now = Date.now();

  db.database
    .prepare(
      `INSERT INTO email_verifications (id, email, code, attempts, verified, used, created_at, expires_at)
       VALUES (?, ?, '123456', 0, 1, 0, ?, ?)`
    )
    .run(id, email, now, now + 10 * 60 * 1000);

  return id;
}

function cryptoOrder(overrides: Partial<Order> = {}): Order {
  const now = Date.now();

  return {
    id: randomUUID(),
    template_slug: TEMPLATE_SLUG,
    template_title: "Modern SaaS",
    base_price_usd: 49,
    currency: "USDT",
    wallet_address: WALLETS.USDT.address,
    pay_amount: "47.990123",
    buyer_name: "Buyer Name",
    buyer_email: "buyer@example.com",
    status: "pending",
    tx_hash: null,
    download_token: null,
    created_at: now,
    expires_at: now + 45 * 60 * 1000,
    confirmed_at: null,
    payment_provider: "crypto",
    paymegate_order_uuid: null,
    ...overrides,
  };
}

describe("Card checkout order creation", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("two buyers can hold simultaneous pending card checkouts for the same template", async () => {
    let providerCalls = 0;
    globalThis.fetch = async () => {
      providerCalls += 1;
      return jsonResponse({
        success: true,
        data: { orderUUID: randomUUID(), checkoutUrl: `https://pay.example/checkout/${providerCalls}` },
      });
    };

    const firstVerification = await verifiedEmail(db, "first@example.com");
    const secondVerification = await verifiedEmail(db, "second@example.com");

    const first = await startPaymegateCheckout(
      checkoutRequest(firstVerification, "first@example.com", "198.51.100.11")
    );
    const firstBody = (await first.json()) as { ok?: boolean; orderId?: string; error?: string };
    assert.equal(first.status, 200, JSON.stringify(firstBody));
    assert.equal(firstBody.ok, true);

    // Regression: the pending-quote unique index used to cover card orders too,
    // so this second checkout failed with UNIQUE constraint and returned 500.
    const second = await startPaymegateCheckout(
      checkoutRequest(secondVerification, "second@example.com", "198.51.100.12")
    );
    const secondBody = (await second.json()) as { ok?: boolean; orderId?: string; error?: string };
    assert.equal(second.status, 200, JSON.stringify(secondBody));
    assert.equal(secondBody.ok, true);
    assert.notEqual(firstBody.orderId, secondBody.orderId);

    const pending = db.database
      .prepare("SELECT id, payment_provider, status FROM orders WHERE status = 'pending'")
      .all() as { id: string; payment_provider: string; status: string }[];

    assert.equal(pending.length, 2);
    assert.equal(pending.every((row) => row.payment_provider === "paymegate"), true);
  });

  test("a failed provider call does not block the next buyer of the same template", async () => {
    const firstVerification = await verifiedEmail(db, "first@example.com");
    const secondVerification = await verifiedEmail(db, "second@example.com");

    globalThis.fetch = async () => jsonResponse({ error: "provider unavailable" }, 503);

    const failed = await startPaymegateCheckout(
      checkoutRequest(firstVerification, "first@example.com", "198.51.100.21")
    );
    assert.equal(failed.status, 502);

    globalThis.fetch = async () =>
      jsonResponse({
        success: true,
        data: { orderUUID: randomUUID(), checkoutUrl: "https://pay.example/checkout/retry" },
      });

    // The aborted checkout leaves a pending row behind; it must not reserve the
    // template price for the next customer.
    const retry = await startPaymegateCheckout(
      checkoutRequest(secondVerification, "second@example.com", "198.51.100.22")
    );
    const body = (await retry.json()) as { ok?: boolean; error?: string };
    assert.equal(retry.status, 200, JSON.stringify(body));
    assert.equal(body.ok, true);
  });

  test("pending crypto quotes are still unique per currency and amount", async () => {
    await insertOrder(cryptoOrder());

    await assert.rejects(
      () => insertOrder(cryptoOrder({ buyer_email: "other@example.com" })),
      /UNIQUE constraint failed/
    );
  });
});
