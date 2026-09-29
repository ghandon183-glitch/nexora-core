import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { seoGuides } from "@/lib/data/seo-guides";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return [{ locale: "en", slug: "nextjs-templates-for-saas" },
    { locale: "en", slug: "ai-saas-templates" },
    { locale: "en", slug: "creative-agency-website-templates" },
    { locale: "en", slug: "how-to-choose-a-premium-nextjs-template" }];
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = locale === "en" ? seoGuides.find((item) => item.slug === slug) : undefined;
  if (!guide) return { title: "Guide not found", robots: { index: false, follow: false } };

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/en/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
    },
  };
}

export default async function SeoGuidePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (locale !== "en") notFound();

  const guide = seoGuides.find((item) => item.slug === slug);
  if (!guide) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060B18] pt-36 pb-24">
        <Container>
          <article className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              {guide.eyebrow}
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
              {guide.title}
            </h1>
            <p className="mt-6 text-xl leading-9 text-slate-300">
              {guide.intro}
            </p>

            <div className="mt-12 space-y-6">
              {guide.sections.map((section) => (
                <Card key={section.heading} className="p-7">
                  <h2 className="text-2xl font-bold text-white">
                    {section.heading}
                  </h2>
                  <p className="mt-3 leading-7 text-slate-400">{section.body}</p>
                  {section.bullets ? (
                    <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-300">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              ))}
            </div>

            <Card className="mt-10 p-7">
              <h2 className="text-xl font-bold text-white">
                Explore the actual templates
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Open the catalog to compare current prices, shipped demos,
                screenshots, documentation, and purchase options.
              </p>
              <Link href="/templates" className="mt-5 inline-block">
                <Button>Browse templates</Button>
              </Link>
            </Card>
          </article>
        </Container>
      </main>
    </>
  );
}
