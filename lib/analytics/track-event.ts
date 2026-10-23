export type AnalyticsEventParams = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (
      command: "event",
      eventName: string,
      params?: AnalyticsEventParams,
    ) => void;
  }
}

/**
 * Send events through the direct GA4 gtag API when configured.
 * Keep a dataLayer fallback so events remain inspectable before GA4 is set up.
 */
export function trackAnalyticsEvent(
  eventName: string,
  params: AnalyticsEventParams = {},
) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}
