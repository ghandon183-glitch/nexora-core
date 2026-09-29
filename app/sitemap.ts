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
  "/templates/compare",
  "/bundle",
  "/pricing",
  "/components",
  "/about",
  "/contact",
  "/docs",
  "/guides",
  "/faq",
  "/support",
  "/license",
  "/refunds",
  "/privacy",
  "/terms",
];

function buildAlternates(path: string, siteUrl: string) {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `${siteUrl}/${locale}${path}`;
  }
  languages["x-default"] = `${siteUrl}/en${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified: new Date("2026-09-29T00:00:00Z"),
        changeFrequency:
          path === "" || path === "/templates" ? "weekly" : "monthly",
        priority:
          path === ""
            ? 1
            : path === "/templates"
              ? 0.9
              : path === "/faq" || path === "/bundle"
                ? 0.8
                : 0.6,
        alternates: {
          languages: buildAlternates(path, siteUrl),
        },
      });
    }
  }

  const guidePaths = [
    "/guides/nextjs-templates-for-saas",
    "/guides/ai-saas-templates",
    "/guides/creative-agency-website-templates",
    "/guides/how-to-choose-a-premium-nextjs-template",
  ];

  for (const path of guidePaths) {
    entries.push({
      url: `${siteUrl}/en${path}`,
      lastModified: new Date("2026-09-29T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.75,
    });
  }

  const templates = getAllTemplates();

  for (const template of templates) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${siteUrl}/${locale}/templates/${template.slug}`,
        lastModified: new Date(template.lastUpdate || "2026-09-29T00:00:00Z"),
        changeFrequency: "monthly",
        priority: 0.9,
        alternates: {
          languages: buildAlternates(`/templates/${template.slug}`, siteUrl),
        },
      });

      entries.push({
        url: `${siteUrl}/${locale}/docs/${template.slug}`,
        lastModified: new Date(template.lastUpdate || "2026-09-29T00:00:00Z"),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: buildAlternates(`/docs/${template.slug}`, siteUrl),
        },
      });
    }
  }

  return entries;
}
