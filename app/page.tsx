import Navbar from "@/components/navigation/navbar";

import Hero from "@/components/sections/hero";
import TrustedBy from "@/components/sections/trusted-by";
import FeaturedTemplates from "@/components/sections/featured-templates";
import ComponentsShowcase from "@/components/sections/components-showcase";
import Pricing from "@/components/sections/pricing";
import Testimonials from "@/components/sections/testimonials";
import CTA from "@/components/sections/cta";

import DashboardPreview from "@/components/dashboard/dashboard-preview";

import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
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