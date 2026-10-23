import assert from "node:assert/strict";
import { test } from "node:test";

import { trackAnalyticsEvent } from "@/lib/analytics/track-event";

function withWindow(fakeWindow: Window, callback: () => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: fakeWindow,
  });

  try {
    callback();
  } finally {
    if (previous) {
      Object.defineProperty(globalThis, "window", previous);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
}

test("analytics events are sent through the direct GA4 gtag API when configured", () => {
  const calls: Array<[string, string, Record<string, unknown>?]> = [];
  const fakeWindow = {
    gtag: (
      command: "event",
      eventName: string,
      params?: Record<string, unknown>,
    ) => calls.push([command, eventName, params]),
  } as unknown as Window;

  withWindow(fakeWindow, () => {
    trackAnalyticsEvent("purchase", {
      transaction_id: "order-123",
      value: 49,
      currency: "USD",
    });
  });

  assert.deepEqual(calls, [
    [
      "event",
      "purchase",
      {
        transaction_id: "order-123",
        value: 49,
        currency: "USD",
      },
    ],
  ]);
});

test("analytics events remain in dataLayer when GA4 is not configured", () => {
  const dataLayer: Array<Record<string, unknown>> = [];
  const fakeWindow = { dataLayer } as unknown as Window;

  withWindow(fakeWindow, () => {
    trackAnalyticsEvent("begin_checkout", { template_slug: "modern-saas" });
  });

  assert.deepEqual(dataLayer, [
    { event: "begin_checkout", template_slug: "modern-saas" },
  ]);
});
