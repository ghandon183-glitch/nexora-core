import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";

import { templates } from "@/lib/data/templates";

export default function DocsPage() {
  const t = useTranslations("DocsPage");

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
    { title: t("step4Title"), body: t("step4Body") },
    { title: t("step5Title"), body: t("step5Body") },
  ];

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="emerald" />
        <div className="mx-auto max-w-5xl">

          <Heading
            badge={t("badge")}
            title={t("title")}
            description={t("description")}
            align="center"
            accent="emerald"
          />

          <div className="mt-16 space-y-6">
            {steps.map((step) => (
              <Card
                key={step.title}
                className="p-8 hover:-translate-y-0 hover:border-white/10"
              >
                <h3 className="text-lg font-bold text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-slate-400">
                  {step.body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-20">

            <h2 className="text-2xl font-bold text-white">
              {t("templateDocsTitle")}
            </h2>

            <p className="mt-3 text-slate-400">
              {t("templateDocsText")}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {templates.map((template) => (
                <Link
                  key={template.slug}
                  href={`/templates/${template.slug}`}
                  className="block"
                >
                  <Card className="p-6 hover:-translate-y-1 hover:border-cyan-400/30">
                    <Badge>{template.category}</Badge>

                    <p className="mt-4 font-bold text-white">
                      {template.title}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {t("viewTemplateDocs")}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>

          </div>

          <div className="mt-20">

            <h2 className="text-2xl font-bold text-white">
              {t("faqTitle")}
            </h2>

            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <Card
                  key={faq.question}
                  className="p-6 hover:-translate-y-0 hover:border-white/10"
                >
                  <p className="font-semibold text-white">
                    {faq.question}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>

          </div>

        </div>
      </Section>
    </>
  );
}
