import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";
import { seoGuides } from "@/lib/data/seo-guides";

export const metadata: Metadata = {
  title: "Guides for Choosing Next.js Templates",
  description:
    "Practical guides for comparing Next.js, SaaS, AI, agency, and premium website templates.",
};

export function generateStaticParams() {
  return [{ locale: "en" }];
}

export default function GuidesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#060B18] pt-36 pb-24">
        <Container>
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Resources
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
              Next.js Template Guides
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
              Practical, factual guides for choosing a template by product type,
              stack, interaction model, and production requirements.
            </p>

            <div className="mt-12 grid gap-6">
              {seoGuides.map((guide) => (
                <Link key={guide.slug} href={"/guides/" + guide.slug}>
                  <Card className="p-7 transition hover:-translate-y-1 hover:border-cyan-400/30">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                      {guide.eyebrow}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-white">
                      {guide.title}
                    </h2>
                    <p className="mt-3 text-slate-400">{guide.description}</p>
                    <p className="mt-5 text-sm font-semibold text-cyan-300">
                      Read guide →
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
