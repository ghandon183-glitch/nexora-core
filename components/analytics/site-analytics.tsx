"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export default function SiteAnalytics() {
  useEffect(() => {
    track("page_view", { page_path: window.location.pathname });

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;

      const name = element.dataset.analyticsEvent;
      if (!name) return;

      track(name, {
        template_slug: element.dataset.analyticsTemplate || undefined,
        destination: element.getAttribute("href") || undefined,
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
