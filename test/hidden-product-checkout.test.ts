import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { POST as createCryptoOrder } from "@/app/api/orders/create/route";
import { POST as createPaymegateOrder } from "@/app/api/paymegate/create/route";

import { setupDatabase } from "./harness/app";

function request(path: string, ip: string): Request {
  return new Request(`https://nexora.example${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify({
      templateSlug: "all-templates",
      currency: "USDT",
      buyerName: "Buyer Name",
      buyerEmail: "buyer@example.com",
      verificationId: randomUUID(),
    }),
  });
}

test("hidden all-template placeholder cannot be purchased through either checkout API", async () => {
  const db = setupDatabase();

  const cryptoResponse = await createCryptoOrder(
    request("/api/orders/create", "198.51.100.91"),
  );
  const cardResponse = await createPaymegateOrder(
    request("/api/paymegate/create", "198.51.100.92"),
  );

  assert.equal(cryptoResponse.status, 404);
  assert.equal(cardResponse.status, 404);

  const orders = db.database.prepare("SELECT id FROM orders").all() as { id: string }[];
  assert.equal(orders.length, 0, "a hidden product must not create a pending order");
});
