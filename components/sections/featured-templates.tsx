import TemplateCard from "@/components/ui/template-card";

export default function FeaturedTemplates() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-8">

        {/* Header */}
        <div className="mx-auto mb-20 max-w-3xl text-center">

          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            Premium Collection
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            Ready To Launch
            <br />
            Premium Templates
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-400">
            Carefully crafted Next.js templates designed for startups,
            SaaS products, agencies and modern web applications.
          </p>

        </div>

        {/* Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          <TemplateCard
            slug="ai-saas"
            title="SaaS Landing"
            description="Modern landing page focused on conversion, speed and premium user experience."
            image="/templates/ai-saas.jpg"
            badge="Popular"
            price={49}
          />

          <TemplateCard
            slug="startup-dashboard"
            title="Startup Dashboard"
            description="Professional dashboard with analytics, charts, tables and management pages."
            image="/templates/dashboard.jpg"
            badge="New"
            price={69}
          />

          <TemplateCard
            slug="creative-agency"
            title="Agency Website"
            description="Elegant multipage template for creative agencies and digital studios."
            image="/templates/agency.jpg"
            badge="Premium"
            price={59}
          />

        </div>

      </div>
    </section>
  );
}