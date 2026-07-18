import { useTranslations } from "next-intl";
import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";

export default function TermsPage() {
  const t = useTranslations("Legal");

  const sections = [
    { title: t("terms1Title"), body: t("terms1Body") },
    { title: t("terms2Title"), body: t("terms2Body") },
    { title: t("terms3Title"), body: t("terms3Body") },
    { title: t("terms4Title"), body: t("terms4Body") },
    { title: t("terms5Title"), body: t("terms5Body") },
    { title: t("terms6Title"), body: t("terms6Body") },
    { title: t("terms7Title"), body: t("terms7Body") },
  ];

  return (
    <>
      <Navbar />

      <Section>
        <div className="mx-auto max-w-3xl">

          <Heading
            badge={t("termsBadge")}
            title={t("termsTitle")}
            description={t("termsDescription")}
            align="center"
          />

          <div className="mt-16 space-y-6">
            {sections.map((section) => (
              <Card
                key={section.title}
                className="p-8 hover:-translate-y-0 hover:border-white/10"
              >
                <h3 className="text-lg font-bold text-white">
                  {section.title}
                </h3>

                <p className="mt-3 text-slate-400">
                  {section.body}
                </p>
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-600">
            {t("termsDisclaimer")}
          </p>

        </div>
      </Section>
    </>
  );
}
