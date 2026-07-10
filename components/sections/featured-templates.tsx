import TemplateCard from "@/components/ui/template-card";
import Reveal from "@/components/ui/reveal";
import { templates } from "@/lib/data/templates";

export default function FeaturedTemplates() {
  const featured = templates.slice(0, 3);

  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-7xl px-8">

        {/* Header */}
        <Reveal className="mx-auto mb-20 max-w-3xl text-center">

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

        </Reveal>

        {/* Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          {featured.map((template, i) => (
            <Reveal key={template.slug} delay={i * 0.1}>
              <TemplateCard
                slug={template.slug}
                title={template.title}
                description={template.description}
                image={template.image}
                badge={template.badge}
                price={template.price}
                demoUrl={template.demoUrl}
                components={template.components}
              />
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}
