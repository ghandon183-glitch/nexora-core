import { getAllTemplates } from "@/lib/data/get-template";
import { getEnv } from "@/lib/env";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const templates = getAllTemplates();

  const items = templates
    .filter((template) => !template.hidden)
    .map((template) => {
      const url = `${siteUrl}/en/templates/${template.slug}`;
      const image = `${siteUrl}${template.gallery[0] || template.image}`;

      return `<item>
  <g:id>nexora-${escapeXml(template.slug)}</g:id>
  <title>${escapeXml(template.title)}</title>
  <description>${escapeXml(template.description)}</description>
  <link>${escapeXml(url)}</link>
  <g:image_link>${escapeXml(image)}</g:image_link>
  <g:availability>in_stock</g:availability>
  <g:price>${template.price.toFixed(2)} USD</g:price>
  <g:condition>new</g:condition>
  <g:brand>Nexora Core</g:brand>
  <g:product_type>Software &gt; Website Templates</g:product_type>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Nexora Core Templates</title>
    <link>${escapeXml(siteUrl)}/en/templates</link>
    <description>Premium website templates from Nexora Core.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
