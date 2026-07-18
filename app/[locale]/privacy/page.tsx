import { useTranslations } from "next-intl";
import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";

export default function PrivacyPage() {
  const t = useTranslations("Legal");

  const sections = [
    { title: t("privacy1Title"), body: t("privacy1Body") },
    { title: t("privacy2Title"), body: t("privacy2Body") },
    { title: t("privacy3Title"), body: t("privacy3Body") },
    { title: t("privacy4Title"), body: t("privacy4Body") },
    { title: t("privacy5Title"), body: t("privacy5Body") },
    { title: t("privacy6Title"), body: t("privacy6Body") },
  ];

  return (
    <>
      <Navbar />

      <Section>
        <div className="mx-auto max-w-3xl">

          <Heading
            badge={t("privacyBadge")}
            title={t("privacyTitle")}
            description={t("privacyDescription")}
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
            {t("privacyDisclaimer")}
          </p>

        </div>
      </Section>
    </>
  );
}
