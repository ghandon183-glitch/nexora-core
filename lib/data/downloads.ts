// Templates with a real, downloadable source-code package.
export const DOWNLOADS: Record<string, string> = {
  "all-templates": "/downloads/Nexora-All-Templates-v1.0.0.zip",
  "modern-saas": "/downloads/modern-saas.zip",
  "admin-dashboard": "/downloads/admin-dashboard.zip",
  "creative-agency": "/downloads/creative-agency.zip",
  "kiln-estates": "/downloads/kiln-estates.zip",
  "nexi-ai": "/downloads/nexi-ai.zip",
  "aurelia-store": "/downloads/aurelia-store.zip",
  "solace-studio": "/downloads/solace-studio.zip",
  "premium-portfolio": "/downloads/premium-portfolio.zip",
  "aether": "/downloads/aether.zip",
  "premium-blog": "/downloads/premium-blog.zip",
  "premium-restaurant": "/downloads/premium-restaurant.zip",
  "vesper": "/downloads/Nexora-Template-12-Vesper-v1.0.0.zip",
};

export function getDownloadAssetPath(slug: string): string | null {
  return DOWNLOADS[slug] ?? null;
}
