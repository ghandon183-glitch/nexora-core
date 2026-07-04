import { notFound } from "next/navigation";

import Navbar from "@/components/navigation/navbar";
import Sidebar from "@/components/navigation/sidebar";
import FloatingDock from "@/components/navigation/floating-dock";

import Container from "@/components/ui/container";

import ProductGallery from "@/components/product/product-gallery";
import ProductHeader from "@/components/product/product-header";
import ProductTabs from "@/components/product/product-tabs";
import PurchaseCard from "@/components/product/purchase-card";

import RelatedTemplates from "@/components/sections/related-templates";

import { getTemplate } from "@/lib/data/get-template";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TemplateDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const template = getTemplate(slug);

  if (!template) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <FloatingDock />

      <main className="pt-28">

        <Container className="pb-24">

          <div className="flex flex-col xl:flex-row xl:items-start xl:gap-16">

            <div className="min-w-0 flex-1 space-y-16">

              <ProductGallery
                images={template.gallery}
              />

              <ProductHeader
                title={template.title}
                description={template.description}
                badge={template.badge}
                price={template.price}
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

              <PurchaseCard
                price={template.price}
              />

            </div>

          </div>

          <div className="mt-24">

            <RelatedTemplates />

          </div>

        </Container>

      </main>
    </>
  );
}