import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { GET as download } from "@/app/api/download/[token]/route";
import { POST as paymegateWebhook } from "@/app/api/paymegate/webhook/route";
import { processEmailOutbox } from "@/lib/orders/email-delivery";

import {
  insertOrderRow,
  makeOrder,
  paidEvent,
  readOrder,
  readOutbox,
  setupDatabase,
  signedWebhookRequest,
} from "./harness/app";
import { testState } from "./harness/state";

beforeEach(() => {
  setupDatabase();
  testState.assets = {
    fetch: async (request: Request) => {
      assert.equal(
        new URL(request.url).pathname,
        "/downloads/Nexora-Template-12-Vesper-v1.0.0.zip",
      );
      return new Response("zip-payload", {
        status: 200,
        headers: {
          "content-type": "application/zip",
          "content-length": "11",
        },
      });
    },
  };
});

test("PayMeGate confirmation to D1, retryable emails, authorized download, and duplicate protection", async () => {
  const order = await insertOrderRow(
    makeOrder({
      template_slug: "vesper",
      template_title: "Vesper",
      currency: "USD",
      payment_provider: "paymegate",
    }),
  );
  const event = paidEvent(order);

  const webhook = await paymegateWebhook(signedWebhookRequest(event));
  assert.equal(webhook.status, 200);

  const confirmed = readOrder(
    testState.db as Parameters<typeof readOrder>[0],
    order.id,
  );
  assert.equal(confirmed.status, "confirmed");
  assert.ok(confirmed.download_token);
  assert.equal(readOutbox(testState.db as Parameters<typeof readOutbox>[0], order.id).length, 2);

  // Simulate one transient provider/email transport failure. The successful
  // message must stay sent while the failed message remains retryable.
  testState.mailerFailuresRemaining = 1;
  const firstDelivery = await processEmailOutbox(10);
  assert.deepEqual(firstDelivery, { claimed: 2, sent: 1, failed: 1 });

  const afterPartialDelivery = readOutbox(
    testState.db as Parameters<typeof readOutbox>[0],
    order.id,
  );
  assert.equal(afterPartialDelivery.filter((row) => row.status === "sent").length, 1);
  assert.equal(afterPartialDelivery.filter((row) => row.status === "pending").length, 1);

  const db = testState.db as {
    database: { prepare: (sql: string) => { run: (...args: unknown[]) => unknown } };
  };
  db.database
    .prepare("UPDATE email_outbox SET next_attempt_at = 0 WHERE order_id = ? AND status = 'pending'")
    .run(order.id);

  const retry = await processEmailOutbox(10);
  assert.deepEqual(retry, { claimed: 1, sent: 1, failed: 0 });
  assert.equal(testState.mailerCalls.length, 3);
  assert.equal(
    readOutbox(testState.db as Parameters<typeof readOutbox>[0], order.id).every(
      (row) => row.status === "sent",
    ),
    true,
  );

  const token = confirmed.download_token as string;
  const downloadResponse = await download(
    new Request(`https://nexora.example/api/download/${token}`),
    { params: Promise.resolve({ token }) },
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get("content-type"), "application/zip");
  assert.equal(downloadResponse.headers.get("cache-control"), "private, no-store");
  assert.equal(await downloadResponse.text(), "zip-payload");

  // Replaying the same signed event after email delivery must not rotate the
  // entitlement token, requeue either message, or send another email.
  const duplicate = await paymegateWebhook(signedWebhookRequest(event));
  assert.equal(duplicate.status, 200);
  assert.equal(readOrder(testState.db as Parameters<typeof readOrder>[0], order.id).download_token, token);
  assert.equal(readOutbox(testState.db as Parameters<typeof readOutbox>[0], order.id).length, 2);
  assert.equal(testState.mailerCalls.length, 3);
});
