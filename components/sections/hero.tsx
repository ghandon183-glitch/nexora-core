import { useTranslations } from "next-intl";
import HeroPreview from "@/components/ui/hero-preview";
import Reveal from "@/components/ui/reveal";
import { templates } from "@/lib/data/templates";

export default function Hero() {
  const t = useTranslations("Hero");
  const templateCount = templates.length;
  return (
    <section className="relative overflow-hidden pt-36 pb-28">

      {/* Background */}
      <div className="absolute inset-0">

        <div className="absolute left-0 top-0 h-[550px] w-[550px] rounded-full bg-violet-500/15 blur-[140px]" />

        <div className="absolute right-0 top-32 h-[600px] w-[600px] rounded-full bg-cyan-500/15 blur-[180px]" />

        <div className="absolute bottom-0 left-1/3 h-[450px] w-[450px] rounded-full bg-amber-400/10 blur-[160px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,.08),transparent_45%)]" />

      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-20 px-8 lg:grid-cols-2">

        {/* Left */}
        <Reveal y={20}>

          <span className="inline-flex rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-5 py-2 text-sm font-medium text-violet-200">
            {t("badge")}
          </span>

          <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl xl:text-7xl">
            {t("titleLine1")}
            <br />
            {t("titleLine2")}
            <br />
            {t("titleLine3")}
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-9 text-slate-300">
            {t("description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-5">

            <button className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-black transition duration-300 hover:scale-105">
              {t("exploreTemplates")}
            </button>

            <button className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-white transition duration-300 hover:bg-white/10">
              {t("browseComponents")}
            </button>

          </div>

          <div className="mt-14 flex gap-10">

            <div>

              <h3 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
                {templateCount}
              </h3>

              <p className="mt-2 text-slate-400">
                {t("statTemplates")}
              </p>

            </div>

            <div>

              <h3 className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-4xl font-bold text-transparent">
                $0
              </h3>

              <p className="mt-2 text-slate-400">
                {t("statFees")}
              </p>

            </div>

            <div>

              <h3 className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-4xl font-bold text-transparent">
                100%
              </h3>

              <p className="mt-2 text-slate-400">
                {t("statStack")}
              </p>

            </div>

          </div>

        </Reveal>

        {/* Right */}

        <Reveal x={40} y={0} delay={0.15}>
          <HeroPreview />
        </Reveal>

      </div>

    </section>
  );
}
