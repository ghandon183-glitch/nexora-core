import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, test } from "node:test";

import { POST as sendVerification } from "@/app/api/verify-email/send/route";
import { POST as confirmVerification } from "@/app/api/verify-email/confirm/route";

import { setupDatabase } from "./harness/app";
import { testState } from "./harness/state";

function request(url: string, body: unknown, ip = randomUUID()): Request {
  return new Request(`https://nexora.example${url}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

async function requestCode(email: string) {
  const response = await sendVerification(
    request("/api/verify-email/send", { email })
  );
  const body = (await response.json()) as {
    ok?: boolean;
    verificationId?: string;
    error?: string;
  };
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.ok, true);
  assert.ok(body.verificationId);

  const sent = testState.mailerCalls.at(-1);
  assert.ok(sent, "verification email must be sent");
  assert.equal(sent.to, email.toLowerCase());
  const code = sent.subject.match(/(\d{6})$/)?.[1];
  assert.ok(code, "verification email subject must contain the six-digit code");

  return { id: body.verificationId!, code };
}

describe("Checkout email verification", () => {
  beforeEach(() => {
    setupDatabase();
  });

  test("sends a code and verifies the exact verification ID and email", async () => {
    const email = `buyer-${randomUUID()}@example.com`;
    const { id, code } = await requestCode(email.toUpperCase());

    const response = await confirmVerification(
      request("/api/verify-email/confirm", { verificationId: id, code })
    );
    const body = (await response.json()) as { ok?: boolean; error?: string };

    assert.equal(response.status, 200, JSON.stringify(body));
    assert.deepEqual(body, { ok: true });

    const row = testState.db as { database: { prepare: (sql: string) => { get: (...args: unknown[]) => unknown } } };
    const record = row.database
      .prepare("SELECT email, verified, used FROM email_verifications WHERE id = ?")
      .get(id) as { email: string; verified: number; used: number };
    assert.equal(record.email, email.toLowerCase());
    assert.equal(record.verified, 1);
    assert.equal(record.used, 0);
  });

  test("rejects a wrong code without consuming the verification, then accepts the correct code", async () => {
    const email = `retry-${randomUUID()}@example.com`;
    const { id, code } = await requestCode(email);
    const wrongCode = code === "000000" ? "000001" : "000000";

    const rejected = await confirmVerification(
      request("/api/verify-email/confirm", { verificationId: id, code: wrongCode })
    );
    const rejectedBody = (await rejected.json()) as { ok?: boolean; error?: string };
    assert.equal(rejected.status, 400);
    assert.match(rejectedBody.error ?? "", /Incorrect code/);

    const accepted = await confirmVerification(
      request("/api/verify-email/confirm", { verificationId: id, code })
    );
    const acceptedBody = (await accepted.json()) as { ok?: boolean; error?: string };
    assert.equal(accepted.status, 200, JSON.stringify(acceptedBody));
    assert.equal(acceptedBody.ok, true);
  });

  test("rejects an expired verification code", async () => {
    const email = `expired-${randomUUID()}@example.com`;
    const { id, code } = await requestCode(email);
    const db = testState.db as {
      database: { prepare: (sql: string) => { run: (...args: unknown[]) => unknown } };
    };
    db.database
      .prepare("UPDATE email_verifications SET expires_at = ? WHERE id = ?")
      .run(Date.now() - 1, id);

    const response = await confirmVerification(
      request("/api/verify-email/confirm", { verificationId: id, code })
    );
    const body = (await response.json()) as { ok?: boolean; error?: string };
    assert.equal(response.status, 400);
    assert.match(body.error ?? "", /expired/i);
  });
});
