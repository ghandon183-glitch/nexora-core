import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getAllTemplates } from "@/lib/data/get-template";

const siteUrl = process.env.SITE_URL || "https://nexora-core.ghandon183.workers.dev";

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

function buildAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${siteUrl}/${locale}${path}`;
  }
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" || path === "/templates" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/templates" ? 0.9 : 0.6,
        alternates: {
          languages: buildAlternates(path),
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
          languages: buildAlternates(`/templates/${template.slug}`),
        },
      });
    }
  }

  return entries;
}
