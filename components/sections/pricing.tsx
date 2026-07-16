import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import Button from "@/components/ui/button";
import Reveal from "@/components/ui/reveal";
import { templates } from "@/lib/data/templates";
import { getHeadingFontClass } from "@/lib/fonts";

export default function Pricing() {
  const t = useTranslations("Pricing");
  // Only tease 3 templates here — the full catalog (now 5+) lives on
  // the dedicated /pricing page via the "See Full Pricing Details" link
  // below, so this section doesn't keep growing into an awkward grid.
  const featured = templates.slice(0, 3);

  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">

          <span className="rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-orange-500/10 px-5 py-2 text-sm text-amber-300">
            {t("badge")}
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            {t("title")}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            {t("description")}
          </p>

        </Reveal>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {featured.map((template, i) => {
            const popular = template.badge === "Popular";

            return (
              <Reveal key={template.slug} delay={i * 0.1}>
                <div
                  className={`rounded-3xl border p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 ${
                    popular
                      ? "border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-orange-500/5 shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >

                  {popular && (
                    <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-black">
                      {t("bestValue")}
                    </div>
                  )}

                  <h3 className={`text-3xl font-bold text-white ${getHeadingFontClass(template.slug)}`}>
                    {template.title}
                  </h3>

                  <div className="mt-6 text-5xl font-black text-white">
                    ${template.price}
                    <span className="ml-2 text-base font-normal text-gray-500">
                      {t("oneTime")}
                    </span>
                  </div>

                  <p className="mt-4 text-gray-400">
                    {template.description}
                  </p>

                  <ul className="mt-8 space-y-4">

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      {template.components}+ {t("componentsSuffix")}
                    </li>

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      {t("lifetimeUpdates")}
                    </li>

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      {t("commercialLicense")}
                    </li>

                  </ul>

                  <Link href={`/templates/${template.slug}`} className="mt-10 block">
                    <Button
                      variant={popular ? "gradient" : "outline"}
                      className="w-full"
                    >
                      {t("view")} {template.title}
                    </Button>
                  </Link>

                </div>
              </Reveal>
            );
          })}

        </div>

        <Reveal className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl md:flex-row md:text-left">

          <div>
            <h3 className="text-xl font-bold text-white">
              {t("noSubscriptionsTitle")}
            </h3>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              {t("noSubscriptionsText")}
            </p>
          </div>

          <Link href="/pricing">
            <Button variant="outline" className="whitespace-nowrap">
              {t("seeFullPricing")}
            </Button>
          </Link>

        </Reveal>

      </div>
    </section>
  );
}
