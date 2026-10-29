import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { customerEmailMatches, sameUsdAmount } from "@/lib/orders/money";

// Both payment paths (signed webhook and API polling) must agree on what
// counts as the same paid order. These cases pin the exact contract.
describe("Paymegate money matching", () => {
  test("accepts the same cent value in different provider formats", () => {
    assert.equal(sameUsdAmount("49.00", 49), true);
    assert.equal(sameUsdAmount("49.0", 49), true);
    assert.equal(sameUsdAmount("49", 49), true);
    assert.equal(sameUsdAmount("0.10", 0.1), true);
    assert.equal(sameUsdAmount("1.1", 1.1), true);
    assert.equal(sameUsdAmount("199.00", 199), true);
  });

  test("never accepts more or less than the exact cent amount", () => {
    assert.equal(sameUsdAmount("49.004", 49), false);
    assert.equal(sameUsdAmount("49.01", 49), false);
    assert.equal(sameUsdAmount("48.99", 49), false);
    assert.equal(sameUsdAmount("49.000", 49), false);
    assert.equal(sameUsdAmount("0", 49), false);
  });

  test("fails closed on absent or malformed amounts", () => {
    assert.equal(sameUsdAmount(null, 49), false);
    assert.equal(sameUsdAmount(undefined, 49), false);
    assert.equal(sameUsdAmount("", 49), false);
    assert.equal(sameUsdAmount(" 49.00", 49), false);
    assert.equal(sameUsdAmount("49,00", 49), false);
    assert.equal(sameUsdAmount("049.00", 49), false);
    assert.equal(sameUsdAmount("49.00 USD", 49), false);
    assert.equal(sameUsdAmount("-49.00", 49), false);
    assert.equal(sameUsdAmount("1e2", 49), false);
  });
});

describe("Paymegate customer email matching", () => {
  test("treats a missing provider email as no contradiction", () => {
    // The order is already bound by provider UUID, external id and amount.
    assert.equal(customerEmailMatches(null, "buyer@example.com"), true);
    assert.equal(customerEmailMatches(undefined, "buyer@example.com"), true);
    assert.equal(customerEmailMatches("", "buyer@example.com"), true);
  });

  test("accepts the same address with different casing or padding", () => {
    assert.equal(customerEmailMatches("BUYER@example.com", "buyer@example.com"), true);
    assert.equal(customerEmailMatches("  buyer@Example.com ", "buyer@example.com"), true);
    assert.equal(customerEmailMatches("buyer@example.com", "BUYER@EXAMPLE.COM"), true);
  });

  test("rejects a provider email that belongs to someone else", () => {
    assert.equal(customerEmailMatches("someone-else@example.com", "buyer@example.com"), false);
    assert.equal(customerEmailMatches("buyer@example.com.evil.test", "buyer@example.com"), false);
    assert.equal(customerEmailMatches("buyer+alias@example.com", "buyer@example.com"), false);
  });
});
