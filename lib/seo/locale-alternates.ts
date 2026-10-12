import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export function localeAlternates(locale: string, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const language of routing.locales) {
    languages[language] = `${FALLBACK_SITE_URL}/${language}${path}`;
  }
  languages["x-default"] = `${FALLBACK_SITE_URL}/en${path}`;
  return { canonical: `/${locale}${path}`, languages };
}
