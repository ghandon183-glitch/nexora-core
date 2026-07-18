import { useTranslations } from "next-intl";
import Card from "@/components/ui/card";

interface ChangelogItem {
  version: string;
  date: string;
  changes: string[];
}

interface ProductChangelogProps {
  changelog: ChangelogItem[];
}

export default function ProductChangelog({
  changelog,
}: ProductChangelogProps) {
  const t = useTranslations("ProductDetail");
  return (
    <section className="space-y-8">

      <div>

        <h2 className="text-4xl font-bold text-white">
          {t("changelogTitle")}
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          {t("changelogSubtitle")}
        </p>

      </div>

      <div className="space-y-6">

        {changelog.map((release) => (

          <Card
            key={release.version}
            className="p-8"
          >

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <h3 className="text-2xl font-bold text-cyan-400">
                {t("version")} {release.version}
              </h3>

              <span className="text-sm text-slate-500">
                {release.date}
              </span>

            </div>

            <ul className="mt-6 space-y-3">

              {release.changes.map((change) => (

                <li
                  key={change}
                  className="flex items-start gap-3 text-slate-300"
                >
                  <span className="mt-1 text-cyan-400">
                    ●
                  </span>

                  <span>
                    {change}
                  </span>

                </li>

              ))}

            </ul>

          </Card>

        ))}

      </div>

    </section>
  );
}