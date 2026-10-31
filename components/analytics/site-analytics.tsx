"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { buildViewItemEvent } from "@/lib/analytics/view-item";
import { trackAnalyticsEvent } from "@/lib/analytics/track-event";

export default function SiteAnalytics() {
  // The app shell (this component) mounts once per locale and survives
  // client-side navigation. Re-run the view when the route changes so
  // client-side visits to another template still report view_item for the
  // product that is actually on screen.
  const pathname = usePathname();

  useEffect(() => {
    const view = document.querySelector<HTMLElement>("[data-analytics-view-item]");
    const viewEvent = buildViewItemEvent({
      analyticsTemplate: view?.dataset.analyticsTemplate,
      analyticsName: view?.dataset.analyticsName,
      analyticsCategory: view?.dataset.analyticsCategory,
      analyticsPrice: view?.dataset.analyticsPrice,
    });

    if (viewEvent) {
      trackAnalyticsEvent(viewEvent.event, viewEvent.params);
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
