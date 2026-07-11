import { Space_Grotesk, Inter, Bebas_Neue } from "next/font/google";

// Curated per-template font pairings (via ui-ux-pro-max design database):
// - Modern SaaS (violet/tech): "Tech Startup" pairing -> Space Grotesk
// - Admin Dashboard (cyan/data): "Minimal Swiss" pairing -> Inter
// - Creative Agency (pink/orange): "Bold Statement" pairing -> Bebas Neue
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading-saas",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading-dashboard",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-heading-agency",
});

export function getHeadingFontClass(slug: string): string {
  switch (slug) {
    case "modern-saas":
      return `${spaceGrotesk.variable} font-[family-name:var(--font-heading-saas)]`;
    case "admin-dashboard":
      return `${inter.variable} font-[family-name:var(--font-heading-dashboard)]`;
    case "creative-agency":
      return `${bebasNeue.variable} font-[family-name:var(--font-heading-agency)] tracking-wide`;
    default:
      return "";
  }
}
