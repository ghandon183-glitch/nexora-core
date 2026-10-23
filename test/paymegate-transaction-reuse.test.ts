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

test("PayMeGate transaction identifiers cannot confirm two different orders", async () => {
  const db = setupDatabase();
  const firstOrder = await insertOrderRow(makeOrder());
  const secondOrder = await insertOrderRow(makeOrder({ pay_amount: "49.01" }));

  const firstResponse = await POST(
    signedWebhookRequest(
      paidEvent(firstOrder, {
        transactionUUID: "txn_reused_across_orders",
        transactionRef: "ref_reused_across_orders",
      })
    )
  );
  assert.equal(firstResponse.status, 200);
  assert.equal(readOrder(db, firstOrder.id).status, "confirmed");

  const secondResponse = await POST(
    signedWebhookRequest(
      paidEvent(secondOrder, {
        transactionUUID: "txn_reused_across_orders",
        transactionRef: "ref_reused_across_orders",
      })
    )
  );

  assert.equal(secondResponse.status, 409);
  assert.equal(readOrder(db, secondOrder.id).status, "pending");
  assert.equal(readOrder(db, secondOrder.id).download_token, null);
  assert.equal(readOutbox(db, firstOrder.id).length, 2);
  assert.equal(readOutbox(db, secondOrder.id).length, 0);
});
