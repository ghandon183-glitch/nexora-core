import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldTrackPurchase, type PurchaseEventStorage } from "@/lib/analytics/purchase-dedupe";

function createStorage(): PurchaseEventStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

test("a confirmed order emits purchase only once across checkout remounts", () => {
  const storage = createStorage();

  assert.equal(shouldTrackPurchase("order-123", storage), true);
  assert.equal(shouldTrackPurchase("order-123", storage), false);
  assert.equal(shouldTrackPurchase("order-456", storage), true);
});

test("blank order ids cannot create purchase events", () => {
  assert.equal(shouldTrackPurchase("   ", createStorage()), false);
});

test("storage failures fail open so a confirmed purchase is still measured", () => {
  const storage: PurchaseEventStorage = {
    getItem() {
      throw new Error("storage blocked");
    },
    setItem() {
      throw new Error("storage blocked");
    },
  };

  assert.equal(shouldTrackPurchase("order-123", storage), true);
});
