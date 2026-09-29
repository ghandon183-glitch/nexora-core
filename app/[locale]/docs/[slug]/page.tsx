import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTemplate, getAllTemplates } from "@/lib/data/get-template";
import { getTemplateGuide } from "@/lib/data/template-guides";
import { routing, type Locale } from "@/i18n/routing";
import { getEnv } from "@/lib/env";

import Navbar from "@/components/navigation/navbar";
import ProductGuide from "@/components/product/product-guide";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllTemplates().map((template) => ({ locale, slug: template.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const template = getTemplate(slug);

  if (!template || !routing.locales.includes(locale as Locale)) {
    return {
      title: "Documentation not found",
      robots: { index: false, follow: false },
    };
  }

  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const canonicalPath = `/${locale}/docs/${template.slug}`;
  const languages: Record<string, string> = {};

  for (const language of routing.locales) {
    languages[language] = `${siteUrl}/${language}/docs/${template.slug}`;
  }
  languages["x-default"] = `${siteUrl}/en/docs/${template.slug}`;

  return {
    title: `${template.title} Documentation`,
    description: `Installation, customization and deployment documentation for the ${template.title} website template.`,
    alternates: { canonical: canonicalPath, languages },
  };
}

export default async function TemplateDocsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const template = getTemplate(slug);
  const guide = getTemplateGuide(slug);

  if (!template || !guide || !routing.locales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060B18] pt-36 pb-24">
        <Container>
          <div className="mx-auto max-w-5xl">
            <div className="mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Template documentation
              </p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
                {template.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
                {template.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {template.framework}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {template.styling}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Version {template.version}
                </span>
              </div>
            </div>

            <ProductGuide guide={guide} />

            <Card className="mt-10 p-7">
              <h2 className="text-lg font-bold text-white">Before you publish</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Replace demo content, verify third-party asset licenses, connect
                production services, test the complete user journey, and run a
                production build. The template is a professional starting
                point—not a substitute for your product&apos;s own content,
                backend, legal pages, or service configuration.
              </p>
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
}
