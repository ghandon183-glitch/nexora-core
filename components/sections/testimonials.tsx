import { useTranslations } from "next-intl";
import Reveal from "@/components/ui/reveal";
import Card from "@/components/ui/card";

export default function Testimonials() {
  const t = useTranslations("Testimonials");

  const reasons = [
    {
      title: t("reason1Title"),
      text: t("reason1Text"),
      glow: "violet" as const,
    },
    {
      title: t("reason2Title"),
      text: t("reason2Text"),
      glow: "amber" as const,
    },
    {
      title: t("reason3Title"),
      text: t("reason3Text"),
      glow: "cyan" as const,
    },
  ];

  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">

          <span className="rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-5 py-2 text-sm text-violet-200">
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

          {reasons.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1}>
              <Card glow={item.glow} className="p-8">

                <h3 className="text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-300">
                  {item.text}
                </p>

              </Card>
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}
