import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, test } from "node:test";

import { GET as download } from "@/app/api/download/[token]/route";
import { insertOrderRow, makeOrder, setupDatabase } from "./harness/app";
import { testState } from "./harness/state";

describe("download entitlement", () => {
  beforeEach(() => {
    setupDatabase();
    testState.assets = {
      fetch: async (request: Request) => {
        assert.equal(new URL(request.url).pathname, "/downloads/vesper.zip");
        return new Response("zip-payload", {
          status: 200,
          headers: { "content-type": "application/zip", "content-length": "11" },
        });
      },
    };
  });

  test("denies a valid token while the order is still pending", async () => {
    const token = randomUUID();
    const order = makeOrder({ status: "pending", download_token: token });
    await insertOrderRow(order);

    const response = await download(
      new Request(`https://nexora.example/api/download/${token}`),
      { params: Promise.resolve({ token }) },
    );

    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  test("serves the purchased ZIP only after the order is confirmed", async () => {
    const token = randomUUID();
    const order = makeOrder({
      status: "confirmed",
      download_token: token,
      confirmed_at: Date.now(),
    });
    await insertOrderRow(order);

    const response = await download(
      new Request(`https://nexora.example/api/download/${token}`),
      { params: Promise.resolve({ token }) },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/zip");
    assert.equal(response.headers.get("content-disposition"), 'attachment; filename="vesper.zip"');
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(await response.text(), "zip-payload");
  });

  test("does not allow a confirmed single-template order to download another template", async () => {
    const token = randomUUID();
    const order = makeOrder({
      template_slug: "vesper",
      status: "confirmed",
      download_token: token,
      confirmed_at: Date.now(),
    });
    await insertOrderRow(order);

    const response = await download(
      new Request(`https://nexora.example/api/download/${token}?slug=aether`),
      { params: Promise.resolve({ token }) },
    );

    assert.equal(response.status, 403);
  });

  test("rejects malformed tokens before querying the order database", async () => {
    const token = "not-a-uuid";
    const response = await download(
      new Request(`https://nexora.example/api/download/${token}`),
      { params: Promise.resolve({ token }) },
    );

    assert.equal(response.status, 404);
  });
});
