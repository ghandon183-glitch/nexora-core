"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { trackAnalyticsEvent } from "@/lib/analytics/track-event";

export default function SiteAnalytics() {
  // The app shell (this component) mounts once per locale and survives
  // client-side navigation. Re-run the view when the route changes so
  // client-side visits to another template still report view_item.
  const pathname = usePathname();

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
  }, [pathname]);

  return null;
}
