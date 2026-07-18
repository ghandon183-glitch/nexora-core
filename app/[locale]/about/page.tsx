import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Card from "@/components/ui/card";

export default function AboutPage() {
  const t = useTranslations("AboutPage");
  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="fuchsia" />
        <div className="mx-auto max-w-3xl">

          <Heading
            badge={t("badge")}
            title={t("title")}
            description={t("description")}
            align="center"
            accent="fuchsia"
          />

          <div className="mt-16 space-y-6">

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                {t("card1Title")}
              </h3>

              <p className="mt-3 text-slate-400">
                {t("card1Body")}
              </p>
            </Card>

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                {t("card2Title")}
              </h3>

              <p className="mt-3 text-slate-400">
                {t("card2Body")}
              </p>
            </Card>

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                {t("card3Title")}
              </h3>

              <p className="mt-3 text-slate-400">
                {t("card3BodyPart1")}{" "}
                <Link href="/contact" className="text-cyan-400 hover:underline">
                  {t("card3LinkText")}
                </Link>{" "}
                {t("card3BodyPart2")}
              </p>
            </Card>

          </div>

        </div>
      </Section>
    </>
  );
}
