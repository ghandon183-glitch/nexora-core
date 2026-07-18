"use client";

import { useTranslations } from "next-intl";

import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Tabs from "@/components/ui/tabs";
import FeatureCard from "@/components/ui/feature-card";

interface ShowcaseProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Showcase({ title, description, children }: ShowcaseProps) {
  return (
    <Card className="p-8 hover:-translate-y-0 hover:border-white/10">

      <h3 className="text-xl font-bold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-8">
        {children}
      </div>

    </Card>
  );
}

export default function ComponentsPage() {
  const t = useTranslations("ComponentsPage");
  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="violet" />
        <div className="mx-auto max-w-7xl">

          <Heading
            badge={t("badge")}
            title={t("title")}
            description={t("description")}
            align="center"
            accent="violet"
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">

            <Showcase
              title={t("buttonTitle")}
              description={t("buttonDesc")}
            >
              <Button>{t("buttonPrimary")}</Button>
              <Button variant="outline">{t("buttonOutline")}</Button>
              <Button variant="ghost">{t("buttonGhost")}</Button>
            </Showcase>

            <Showcase
              title={t("badgeTitle")}
              description={t("badgeDesc")}
            >
              <Badge>{t("badgeDefault")}</Badge>
              <Badge variant="success">{t("badgeSuccess")}</Badge>
              <Badge variant="warning">{t("badgeWarning")}</Badge>
            </Showcase>

            <Showcase
              title={t("inputTitle")}
              description={t("inputDesc")}
            >
              <Input aria-label="Example email input" placeholder="you@example.com" className="max-w-xs" />
            </Showcase>

            <Showcase
              title={t("cardTitle")}
              description={t("cardDesc")}
            >
              <Card className="w-full max-w-xs p-6 hover:-translate-y-0 hover:border-white/10">
                <p className="font-semibold text-white">
                  {t("cardDemoTitle")}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {t("cardDemoBody")}
                </p>
              </Card>
            </Showcase>

            <Showcase
              title={t("featureCardTitle")}
              description={t("featureCardDesc")}
            >
              <div className="w-full max-w-xs">
                <FeatureCard
                  title={t("featureCardDemoTitle")}
                  description={t("featureCardDemoDesc")}
                />
              </div>
            </Showcase>

            <Showcase
              title={t("tabsTitle")}
              description={t("tabsDesc")}
            >
              <div className="w-full">
                <Tabs
                  items={[
                    {
                      id: "one",
                      label: t("tabsOverview"),
                      content: (
                        <p className="text-sm text-slate-300">
                          {t("tabsOverviewContent")}
                        </p>
                      ),
                    },
                    {
                      id: "two",
                      label: t("tabsDetails"),
                      content: (
                        <p className="text-sm text-slate-300">
                          {t("tabsDetailsContent")}
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </Showcase>

          </div>

          <Card className="mt-10 p-10 text-center hover:-translate-y-0 hover:border-white/10">
            <p className="text-slate-400">
              {t("moreComponents")}
            </p>
          </Card>

        </div>
      </Section>
    </>
  );
}
