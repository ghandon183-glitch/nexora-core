import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getAllTemplates } from "@/lib/data/get-template";
import { getEnv } from "@/lib/env";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

async function getSiteUrl() {
  const env = await getEnv();
  return env.SITE_URL || FALLBACK_SITE_URL;
}

const staticPaths = [
  "",
  "/templates",
  "/pricing",
  "/components",
  "/about",
  "/contact",
  "/docs",
  "/privacy",
  "/terms",
];

function buildAlternates(path: string, siteUrl: string) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${siteUrl}/${locale}${path}`;
  }
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" || path === "/templates" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/templates" ? 0.9 : 0.6,
        alternates: {
          languages: buildAlternates(path, siteUrl),
        },
      });
    }
  }

  const templates = getAllTemplates();
  for (const template of templates) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}/templates/${template.slug}`,
        lastModified: new Date(template.lastUpdate || Date.now()),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: buildAlternates(`/templates/${template.slug}`, siteUrl),
        },
      });
    }
  }

  return entries;
}
