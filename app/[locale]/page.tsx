import Navbar from "@/components/navigation/navbar";
import Hero from "@/components/sections/hero-optimized";
import TrustedBy from "@/components/sections/trusted-by";
import FeaturedTemplates from "@/components/sections/featured-templates";
import ComponentsShowcase from "@/components/sections/components-showcase";
import Pricing from "@/components/sections/pricing";
import Testimonials from "@/components/sections/testimonials";
import CTA from "@/components/sections/cta";
import DashboardPreview from "@/components/dashboard/dashboard-preview";
import Footer from "@/components/layout/footer";
import { getAllTemplates } from "@/lib/data/get-template";
import { getEnv } from "@/lib/env";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export default async function Home() {
  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const templates = getAllTemplates();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nexora Core",
    url: siteUrl,
    logo: `${siteUrl}/og-image.jpg`,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nexora Core",
    url: siteUrl,
    description:
      "Premium Next.js templates, dashboards, landing pages and reusable UI components.",
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nexora Core premium Next.js templates",
    itemListElement: templates.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: template.title,
      url: `${siteUrl}/en/templates/${template.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <Navbar />
      <main>
        <Hero />
        <TrustedBy />
        <FeaturedTemplates />
        <ComponentsShowcase />
        <DashboardPreview />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
