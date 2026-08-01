import type { MetadataRoute } from "next";

const siteUrl = process.env.SITE_URL || "https://nexora-core.ghandon183.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/checkout",
          "/sign-in",
          "/sign-up",
          "/api/",
          "/*/dashboard",
          "/*/checkout",
          "/*/sign-in",
          "/*/sign-up",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
