import { useTranslations } from "next-intl";

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
  const t = useTranslations("ProductDetail");
  return (
    <section className="space-y-10">

      <div>
        <h2 className="mb-4 text-3xl font-bold text-white">
          {t("overviewTitle")}
        </h2>

        <p className="leading-8 text-slate-400">
          {t("overviewText")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <InfoCard title={t("framework")} value={framework} />
        <InfoCard title={t("styling")} value={styling} />
        <InfoCard title={t("componentsLabel")} value={components} />
        <InfoCard title={t("versionLabel")} value={version} />
        <InfoCard title={t("updatedLabel")} value={lastUpdate} />
        <InfoCard title={t("categoryLabel")} value={category} />

      </div>

      <div>

        <h3 className="mb-4 text-xl font-semibold text-white">
          {t("featuresTitle")}
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
          {t("tagsTitle")}
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