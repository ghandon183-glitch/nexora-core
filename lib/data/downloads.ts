// Templates with a real, downloadable source-code package. Templates not
// listed here don't have a build yet — customers still see their purchase,
// but get a "coming soon" note instead of a broken download link.
//
// These paths point at static assets (bundled from `public/downloads/*.zip`
// into the Cloudflare `ASSETS` binding). They are INTERNAL asset paths used
// only by the token-authorized download endpoint (`app/api/download/[token]`)
// — they must NEVER be rendered as direct hrefs, because direct access to
// `/downloads/<slug>.zip` is denied in production (see `middleware.ts` and
// `wrangler.jsonc` `assets.run_worker_first`).
//
// Keep this in sync with public/downloads/*.zip and lib/data/templates.ts.
export const DOWNLOADS: Record<string, string> = {
  "modern-saas": "/downloads/modern-saas.zip",
  "admin-dashboard": "/downloads/admin-dashboard.zip",
  "creative-agency": "/downloads/creative-agency.zip",
  "kiln-estates": "/downloads/kiln-estates.zip",
  "nexi-ai": "/downloads/nexi-ai.zip",
  "aurelia-store": "/downloads/aurelia-store.zip",
  "solace-studio": "/downloads/solace-studio.zip",
};

/**
 * Returns the internal asset path for a purchased template's ZIP, or `null`
 * if no package exists yet. Server-only — callers must have already
 * authorized the request via the order's `download_token`.
 */
export function getDownloadAssetPath(slug: string): string | null {
  return DOWNLOADS[slug] ?? null;
}
