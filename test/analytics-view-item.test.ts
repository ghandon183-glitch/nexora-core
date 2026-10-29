import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildViewItemEvent } from "@/lib/analytics/view-item";

describe("GA4 view_item payload", () => {
  test("maps the product marker to the product that is on screen", () => {
    const event = buildViewItemEvent({
      analyticsTemplate: "modern-saas",
      analyticsName: "Modern SaaS",
      analyticsCategory: "Landing Page",
      analyticsPrice: "49",
    });

    assert.ok(event);
    assert.equal(event.event, "view_item");
    assert.equal(event.params.template_slug, "modern-saas");
    assert.equal(event.params.currency, "USD");
    assert.equal(event.params.value, 49);
    assert.deepEqual(event.params.items, [
      {
        item_id: "nexora-modern-saas",
        item_name: "Modern SaaS",
        item_category: "Landing Page",
        price: 49,
        quantity: 1,
      },
    ]);
  });

  test("emits nothing on pages that are not a single-product view", () => {
    assert.equal(buildViewItemEvent(undefined), null);
    assert.equal(buildViewItemEvent(null), null);
    assert.equal(buildViewItemEvent({}), null);
    assert.equal(buildViewItemEvent({ analyticsTemplate: "   " }), null);
  });

  test("never emits a NaN price or an empty item name", () => {
    const invalid = buildViewItemEvent({
      analyticsTemplate: "vesper",
      analyticsPrice: "not-a-number",
    });
    assert.ok(invalid);
    assert.equal(invalid.params.value, 0);
    assert.equal(invalid.params.items[0].price, 0);
    assert.equal(invalid.params.items[0].item_name, "vesper");

    const negative = buildViewItemEvent({
      analyticsTemplate: "vesper",
      analyticsPrice: "-5",
    });
    assert.ok(negative);
    assert.equal(negative.params.value, 0);
  });

  test("trims the marker so one product cannot be reported under two slugs", () => {
    const event = buildViewItemEvent({ analyticsTemplate: "  vesper  ", analyticsPrice: "89" });
    assert.ok(event);
    assert.equal(event.params.template_slug, "vesper");
    assert.equal(event.params.items[0].item_id, "nexora-vesper");
    assert.equal(event.params.value, 89);
  });
});
