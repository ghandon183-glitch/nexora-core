import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // English is the default/fallback locale. The other five cover the
  // markets identified as highest-value for an international dev-tool
  // audience. Persian/RTL is intentionally out of scope for this phase —
  // it needs its own layout-direction pass, not just translated strings.
  locales: ["en", "es", "de", "fr", "tr", "zh"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
