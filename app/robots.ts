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
        // The Disallow prefix "/*/admin" also matches public pages whose path
        // merely contains "admin" (e.g. /en/docs/admin-dashboard), so these
        // longer Allow entries carve the public ones back out. Checkout,
        // dashboard, sign-in/up and the admin panel stay blocked.
        allow: [
          "/",
          "/*/docs/admin-dashboard",
          "/docs/admin-dashboard",
          "/*/templates/admin-dashboard",
          "/templates/admin-dashboard",
          "/demo/admin-dashboard",
        ],
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
