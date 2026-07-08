import TemplateCard from "@/components/ui/template-card";
import { getAllTemplates } from "@/lib/data/get-template";

export default function RelatedTemplates() {
  const templates = getAllTemplates();

  return (
    <section className="mt-24">

      <div className="mb-10">

        <h2 className="text-3xl font-bold text-white">
          Related Templates
        </h2>

        <p className="mt-3 text-slate-400">
          You may also like these premium templates.
        </p>

      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

        {templates.map((template) => (

          <TemplateCard
            key={template.slug}
            slug={template.slug}
            title={template.title}
            description={template.description}
            image={template.image}
            badge={template.badge}
            price={template.price}
              demoUrl={template.demoUrl}
          />

        ))}

      </div>

    </section>
  );
}