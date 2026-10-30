import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, test } from "node:test";

import {
  claimEmailOutbox,
  enqueueOrderEmail,
  markOrderConfirmed,
} from "@/lib/orders/db";
import { processEmailOutbox } from "@/lib/orders/email-delivery";

import { insertOrderRow, makeOrder, readOrder, readOutbox, setupDatabase } from "./harness/app";
import type { TestD1 } from "./harness/d1";
import { testState } from "./harness/state";

async function queueEmails(db: TestD1, orderId: string): Promise<void> {
  for (const kind of ["owner", "customer"] as const) {
    await enqueueOrderEmail({
      id: `${orderId}:${kind}`,
      orderId,
      kind,
      toEmail: kind === "owner" ? "owner@nexora.example" : "buyer@example.com",
      subject: `${kind} subject`,
      html: `<p>${kind} body</p>`,
    });
  }
}

async function confirmedOrder(db: TestD1) {
  const order = await insertOrderRow(makeOrder());
  await markOrderConfirmed(order.id, "0xtesthash", randomUUID());
  await queueEmails(db, order.id);
  return order;
}

describe("Email outbox", () => {
  let db: TestD1;

  beforeEach(() => {
    db = setupDatabase();
  });

  test("enqueue keeps one message per kind and never resurrects a sent message", async () => {
    const order = await insertOrderRow(makeOrder());
    await markOrderConfirmed(order.id, "0xhash", "22222222-2222-4222-8222-222222222222");

    await queueEmails(db, order.id);
    await queueEmails(db, order.id);

    assert.equal(readOutbox(db, order.id).length, 2);
  });

  test("concurrent claims let exactly one worker take a message", async () => {
    const order = await confirmedOrder(db);
    const outboxRow = readOutbox(db, order.id)[0];

    const claims = await Promise.all(
      Array.from({ length: 6 }, () => claimEmailOutbox(outboxRow.id))
    );

    assert.equal(claims.filter(Boolean).length, 1);
    assert.equal(readOutbox(db, order.id).find((row) => row.id === outboxRow.id)?.attempts, 1);
  });

  test("a failed send schedules a backoff retry and releases the order lock", async () => {
    const order = await confirmedOrder(db);
    testState.mailerFailuresRemaining = 2;

    const startedAt = Date.now();
    const result = await processEmailOutbox(10);

    assert.deepEqual(result, { claimed: 2, sent: 0, failed: 2 });

    for (const row of readOutbox(db, order.id)) {
      assert.equal(row.status, "pending");
      assert.equal(row.attempts, 1);
      assert.equal(row.locked_at, null);
      assert.ok(row.next_attempt_at > startedAt + 30_000, "retry must be delayed by backoff");
      assert.ok(row.last_error);
    }

    const afterFailure = readOrder(db, order.id);
    assert.equal(afterFailure.owner_email_status, "pending");
    assert.equal(afterFailure.customer_email_status, "pending");
    assert.ok(afterFailure.email_last_error);
  });

  test("a retry after the backoff window delivers and finalises the order state", async () => {
    const order = await confirmedOrder(db);
    testState.mailerFailuresRemaining = 2;
    await processEmailOutbox(10);

    db.database.prepare("UPDATE email_outbox SET next_attempt_at = 0").run();

    const retry = await processEmailOutbox(10);

    assert.deepEqual(retry, { claimed: 2, sent: 2, failed: 0 });

    for (const row of readOutbox(db, order.id)) {
      assert.equal(row.status, "sent");
      assert.ok(row.sent_at);
      assert.equal(row.last_error, null);
    }

    const afterRetry = readOrder(db, order.id);
    assert.equal(afterRetry.owner_email_status, "sent");
    assert.equal(afterRetry.customer_email_status, "sent");
    assert.equal(afterRetry.email_last_error, null);
    assert.equal(testState.mailerCalls.length, 4);
  });

  test("a later outbox run never resends a delivered message", async () => {
    await confirmedOrder(db);
    await processEmailOutbox(10);

    const second = await processEmailOutbox(10);

    assert.deepEqual(second, { claimed: 0, sent: 0, failed: 0 });
    assert.equal(testState.mailerCalls.length, 2);
  });

  test("two concurrent outbox workers never double-send the same message", async () => {
    const first = await confirmedOrder(db);
    const second = await confirmedOrder(db);

    const [a, b] = await Promise.all([processEmailOutbox(10), processEmailOutbox(10)]);

    assert.equal(a.claimed + b.claimed, 4);
    assert.equal(a.sent + b.sent, 4);
    assert.equal(testState.mailerCalls.length, 4);

    for (const order of [first, second]) {
      for (const row of readOutbox(db, order.id)) {
        assert.equal(row.status, "sent");
        assert.equal(row.attempts, 1);
      }
    }
  });

  test("a stale 'sending' lock is reclaimed so a crashed worker cannot strand mail", async () => {
    const order = await confirmedOrder(db);
    const row = readOutbox(db, order.id)[0];

    db.database
      .prepare("UPDATE email_outbox SET status = 'sending', locked_at = ?, attempts = 1 WHERE id = ?")
      .run(Date.now() - 60 * 60 * 1000, row.id);

    const result = await processEmailOutbox(10);

    assert.equal(result.sent, 2);
    assert.equal(readOutbox(db, order.id).every((message) => message.status === "sent"), true);
  });

  test("an in-flight lock is respected and not stolen", async () => {
    const order = await confirmedOrder(db);
    const row = readOutbox(db, order.id)[0];

    db.database
      .prepare("UPDATE email_outbox SET status = 'sending', locked_at = ? WHERE id = ?")
      .run(Date.now(), row.id);

    const claim = await claimEmailOutbox(row.id);

    assert.equal(claim, null);
  });
});


  test("permanently failing email reaches the retry cap and is excluded from future runs", async () => {
    const order = await confirmedOrder(db);
    testState.mailerFailuresRemaining = 20;

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      db.database.prepare("UPDATE email_outbox SET next_attempt_at = 0 WHERE order_id = ?").run(order.id);
      const result = await processEmailOutbox(10);
      assert.equal(result.failed, 2, `attempt ${attempt} should fail both messages`);
    }

    const terminalRows = readOutbox(db, order.id);
    assert.equal(terminalRows.length, 2);
    assert.ok(terminalRows.every((row) => row.attempts === 6));
    assert.ok(terminalRows.every((row) => typeof row.dead_lettered_at === "number"));

    const afterCap = await processEmailOutbox(10);
    assert.deepEqual(afterCap, { claimed: 0, sent: 0, failed: 0 });
    assert.equal(testState.mailerCalls.length, 12);
  });
