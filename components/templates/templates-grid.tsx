import TemplateCard from "@/components/ui/template-card";
import type { Template } from "@/lib/data/templates";

interface Props {
  templates: Template[];
}

export default function TemplatesGrid({
  templates,
}: Props) {
  if (templates.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 py-24 text-center">

        <h2 className="text-3xl font-bold text-white">
          No templates found
        </h2>

        <p className="mt-4 text-slate-400">
          Try searching with another keyword.
        </p>

      </div>
    );
  }

  return (
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
              components={template.components}
        />
      ))}

    </div>
  );
}