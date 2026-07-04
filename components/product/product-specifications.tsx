import Card from "@/components/ui/card";

interface ProductSpecificationsProps {
  framework: string;
  styling: string;
  components: number;
}

export default function ProductSpecifications({
  framework,
  styling,
  components,
}: ProductSpecificationsProps) {
  const items = [
    {
      title: "Framework",
      value: framework,
    },
    {
      title: "Styling",
      value: styling,
    },
    {
      title: "Components",
      value: `${components}+`,
    },
  ];

  return (
    <section className="mt-16">
      <h2 className="mb-8 text-3xl font-black text-white">
        Specifications
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.title}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {item.title}
            </p>

            <h3 className="mt-5 text-2xl font-bold text-white">
              {item.value}
            </h3>
          </Card>
        ))}
      </div>
    </section>
  );
}