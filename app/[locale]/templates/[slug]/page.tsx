import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import ProductGallery from "@/components/product/product-gallery";
import ProductHeader from "@/components/product/product-header";
import ProductTabs from "@/components/product/product-tabs";
import PurchaseCard from "@/components/product/purchase-card";
import RelatedTemplates from "@/components/sections/related-templates";
import { getTemplate, getAllTemplates } from "@/lib/data/get-template";
import { getHeadingFontClass } from "@/lib/fonts";
import { routing, type Locale } from "@/i18n/routing";
import { getEnv } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const FALLBACK_SITE_URL = "https://nexora-core.nxora.workers.dev";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllTemplates().map((template) => ({ locale, slug: template.slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const template = getTemplate(slug);

  if (!template || !routing.locales.includes(locale as Locale)) {
    return { title: "Template not found", robots: { index: false, follow: false } };
  }

  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const canonicalPath = `/${locale}/templates/${template.slug}`;
  const languages: Record<string, string> = {};

  for (const language of routing.locales) {
    languages[language] = `${siteUrl}/${language}/templates/${template.slug}`;
  }
  languages["x-default"] = `${siteUrl}/en/templates/${template.slug}`;

  return {
    title: template.title,
    description: template.description,
    alternates: { canonical: canonicalPath, languages },
    openGraph: {
      title: `${template.title} | Nexora Core`,
      description: template.description,
      url: canonicalPath,
      type: "website",
      images: [{ url: template.image, alt: `${template.title} preview` }],
    },
  };
}

export default async function TemplateDetailsPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const template = getTemplate(slug);

  if (!template) notFound();

  const env = await getEnv();
  const siteUrl = env.SITE_URL || FALLBACK_SITE_URL;
  const pageUrl = `${siteUrl}/${locale}/templates/${template.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: template.title,
    description: template.description,
    image: [`${siteUrl}${template.image}`],
    url: pageUrl,
    brand: { "@type": "Brand", name: "Nexora Core" },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "USD",
      price: template.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Navbar />
      <main className="pt-36">
        <Container className="pb-24">
          <div className="flex flex-col xl:flex-row xl:items-start xl:gap-16">
            <div className="min-w-0 flex-1 space-y-16">
              <ProductGallery images={template.gallery} />
              <ProductHeader
                title={template.title}
                description={template.description}
                badge={template.badge}
                price={template.price}
                headingFontClassName={getHeadingFontClass(template.slug)}
                framework={template.framework}
              />
              <ProductTabs
                framework={template.framework}
                styling={template.styling}
                components={template.components}
                version={template.version}
                lastUpdate={template.lastUpdate}
                category={template.category}
                tags={template.tags}
                features={template.features}
                changelog={template.changelog}
              />
            </div>
            <div className="mt-10 w-full xl:mt-0 xl:w-[380px] xl:flex-shrink-0">
              <PurchaseCard slug={template.slug} price={template.price} demoUrl={template.demoUrl} />
            </div>
          </div>
          <div className="mt-24"><RelatedTemplates /></div>
        </Container>
      </main>
    </>
  );
}
