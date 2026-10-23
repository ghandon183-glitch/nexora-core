import assert from "node:assert/strict";
import { test } from "node:test";

import { POST } from "@/app/api/paymegate/webhook/route";
import {
  insertOrderRow,
  makeOrder,
  paidEvent,
  readOrder,
  readOutbox,
  setupDatabase,
  signedWebhookRequest,
} from "./harness/app";

test("PayMeGate webhook rejects a value with extra precision that rounds to the order price", async () => {
  const db = setupDatabase();
  const order = await insertOrderRow(makeOrder());
  // 49.004 rounds to 49.00 with toFixed(2), but is not an exact USD-cent amount.
  const response = await POST(
    signedWebhookRequest(paidEvent(order, { amount: `${order.base_price_usd.toFixed(2)}4` }))
  );

  assert.equal(response.status, 409);
  assert.equal(readOrder(db, order.id).status, "pending");
  assert.equal(readOutbox(db, order.id).length, 0);
});
