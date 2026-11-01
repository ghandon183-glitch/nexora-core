import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import paymentCronWorker from "@/workers/payment-cron";

const originalFetch = globalThis.fetch;
const originalLog = console.log;
const originalError = console.error;

const env = {
  SITE_URL: "https://nexora-core.nxora.workers.dev",
  CRON_SECRET: "test-cron-secret",
};

const controller = {
  cron: "*/5 * * * *",
  scheduledTime: Date.UTC(2026, 10, 1, 9, 0, 0),
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.log = originalLog;
  console.error = originalError;
});

test("Cloudflare cron calls the protected reconciliation endpoint and logs a safe summary", async () => {
  let requestedUrl = "";
  let requestSecret: string | null = null;
  const logs: string[] = [];

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestSecret = new Headers(init?.headers).get("x-cron-secret");
    return jsonResponse({
      ok: true,
      checked: 2,
      confirmed: 1,
      expired: 0,
      review: 0,
      emailsRetried: 2,
      errors: [],
      paymegateErrors: [],
      emailOutbox: { failed: 0 },
    });
  };
  console.log = (...values: unknown[]) => logs.push(values.map(String).join(" "));

  await paymentCronWorker.scheduled(controller, env);

  assert.equal(requestedUrl, "https://nexora-core.nxora.workers.dev/api/cron/check-payments");
  assert.equal(requestSecret, env.CRON_SECRET);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /"confirmed":1/);
  assert.equal(logs[0].includes(env.CRON_SECRET), false);
});

test("Cloudflare cron fails closed when reconciliation reports processing errors", async () => {
  const errors: string[] = [];

  globalThis.fetch = async () =>
    jsonResponse({
      ok: true,
      checked: 1,
      confirmed: 0,
      errors: [],
      paymegateErrors: ["sensitive-order-detail"],
      emailOutbox: { failed: 0 },
    });
  console.error = (...values: unknown[]) => errors.push(values.map(String).join(" "));

  await assert.rejects(
    () => paymentCronWorker.scheduled(controller, env),
    /Payment reconciliation reported processing errors/,
  );

  assert.equal(errors.length, 1);
  assert.equal(errors[0].includes("sensitive-order-detail"), false);
  assert.equal(errors[0].includes(env.CRON_SECRET), false);
});

test("Cloudflare cron fails if the endpoint rejects the shared secret", async () => {
  globalThis.fetch = async () => new Response("Unauthorized", { status: 401 });

  await assert.rejects(
    () => paymentCronWorker.scheduled(controller, env),
    /returned HTTP 401/,
  );
});

test("Cloudflare cron refuses to run without the shared secret", async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({ ok: true });
  };

  await assert.rejects(
    () => paymentCronWorker.scheduled(controller, { ...env, CRON_SECRET: "" }),
    /missing required configuration/,
  );
  assert.equal(fetchCalled, false);
});
