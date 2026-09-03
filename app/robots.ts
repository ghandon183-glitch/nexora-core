import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/checkout",
          "/sign-in",
          "/sign-up",
          "/admin",
          "/*/dashboard",
          "/*/checkout",
          "/*/sign-in",
          "/*/sign-up",
          "/*/admin",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
