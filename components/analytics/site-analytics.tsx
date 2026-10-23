"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/track-event";



export default function SiteAnalytics() {
  useEffect(() => {
    const view = document.querySelector<HTMLElement>("[data-analytics-view-item]");
    if (view) {
      trackAnalyticsEvent("view_item", {
        template_slug: view.dataset.analyticsTemplate,
        currency: "USD",
        value: Number(view.dataset.analyticsPrice || 0),
        items: [
          {
            item_id: `nexora-${view.dataset.analyticsTemplate}`,
            item_name: view.dataset.analyticsName,
            item_category: view.dataset.analyticsCategory,
            price: Number(view.dataset.analyticsPrice || 0),
            quantity: 1,
          },
        ],
      });
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const element = target?.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;

      const name = element.dataset.analyticsEvent;
      if (!name) return;

      trackAnalyticsEvent(name, {
        template_slug: element.dataset.analyticsTemplate || undefined,
        destination: element.getAttribute("href") || undefined,
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
