export function getHeadingFontClass(slug: string): string {
  switch (slug) {
    case "modern-saas": return "";
    case "admin-dashboard": return "";
    case "creative-agency": return "tracking-wide";
    case "kiln-estates": return "";
    case "nexi-ai": return "";
    default: return "";
  }
}
