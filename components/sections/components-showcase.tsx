import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import FeatureCard from "@/components/ui/feature-card";
import Reveal from "@/components/ui/reveal";

export default function ComponentsShowcase() {
  const t = useTranslations("ComponentsShowcase");
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            {t("badge")}
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            {t("title")}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            {t("description")}
          </p>
        </Reveal>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          <Reveal delay={0}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
              <h3 className="text-xl font-bold text-white">{t("buttonsTitle")}</h3>
              <p className="mt-2 text-sm text-gray-400">
                {t("buttonsDesc")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-6">
                <Button>{t("buttonPrimary")}</Button>
                <Button variant="outline">{t("buttonOutline")}</Button>
                <Button variant="ghost">{t("buttonGhost")}</Button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
              <h3 className="text-xl font-bold text-white">{t("badgesTitle")}</h3>
              <p className="mt-2 text-sm text-gray-400">
                {t("badgesDesc")}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-6">
                <Badge>{t("badgeDefault")}</Badge>
                <Badge variant="success">{t("badgeSuccess")}</Badge>
                <Badge variant="warning">{t("badgeWarning")}</Badge>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
              <h3 className="text-xl font-bold text-white">{t("inputsTitle")}</h3>
              <p className="mt-2 text-sm text-gray-400">
                {t("inputsDesc")}
              </p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
                <Input aria-label="Example email input" placeholder="you@example.com" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.24} className="md:col-span-2 lg:col-span-1">
            <FeatureCard
              title={t("featureCardsTitle")}
              description={t("featureCardsDesc")}
            />
          </Reveal>

          <Reveal delay={0.32} className="md:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
              <h3 className="text-xl font-bold text-white">{t("andMoreTitle")}</h3>
              <p className="mt-2 text-sm text-gray-400">
                {t("andMoreDesc")}
              </p>
              <Link href="/components" className="mt-6 inline-block">
                <Button variant="outline">{t("exploreAll")}</Button>
              </Link>
            </div>
          </Reveal>

        </div>

      </div>
    </section>
  );
}
