interface ProductOverviewProps {
  framework: string;
  styling: string;
  components: string;
  version: string;
  lastUpdate: string;
  category: string;
  tags: string[];
  features: string[];
}

export default function ProductOverview({
  framework,
  styling,
  components,
  version,
  lastUpdate,
  category,
  tags,
  features,
}: ProductOverviewProps) {
  return (
    <section className="space-y-10">

      <div>
        <h2 className="mb-4 text-3xl font-bold text-white">
          Overview
        </h2>

        <p className="leading-8 text-slate-400">
          Premium production-ready template built with modern technologies,
          optimized performance and reusable UI components.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <InfoCard title="Framework" value={framework} />
        <InfoCard title="Styling" value={styling} />
        <InfoCard title="Components" value={components} />
        <InfoCard title="Version" value={version} />
        <InfoCard title="Updated" value={lastUpdate} />
        <InfoCard title="Category" value={category} />

      </div>

      <div>

        <h3 className="mb-4 text-xl font-semibold text-white">
          Features
        </h3>

        <ul className="grid gap-3 md:grid-cols-2">

          {features.map((feature) => (
            <li
              key={feature}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-300"
            >
              ✓ {feature}
            </li>
          ))}

        </ul>

      </div>

      <div>

        <h3 className="mb-4 text-xl font-semibold text-white">
          Tags
        </h3>

        <div className="flex flex-wrap gap-3">

          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300"
            >
              {tag}
            </span>
          ))}

        </div>

      </div>

    </section>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

      <p className="mb-2 text-sm uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="text-xl font-semibold text-white">
        {value}
      </p>

    </div>
  );
}