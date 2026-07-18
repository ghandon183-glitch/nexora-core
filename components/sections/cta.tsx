import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/ui/reveal";
import Button from "@/components/ui/button";

export default function CTA() {
  const t = useTranslations("CTA");
  return (
    <section className="py-32">
      <div className="mx-auto max-w-6xl px-8">

        <Reveal className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-amber-400/10 p-16 text-center backdrop-blur-xl">

          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />

          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-amber-400/15 blur-[100px]" />

          <div className="relative">

            <span className="rounded-full border border-fuchsia-400/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-5 py-2 text-sm text-fuchsia-200">
              {t("badge")}
            </span>

            <h2 className="mt-8 text-5xl font-black text-white">
              {t("title")}
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              {t("description")}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-6">

              <Link href="/templates">
                <Button variant="gradient" className="px-8 py-4 text-base">
                  {t("exploreTemplates")}
                </Button>
              </Link>

              <Link href="/components">
                <Button variant="outline" className="px-8 py-4 text-base">
                  {t("viewComponents")}
                </Button>
              </Link>

            </div>

          </div>

        </Reveal>

      </div>
    </section>
  );
}
