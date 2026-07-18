"use client";

import { useTranslations } from "next-intl";
import Tabs from "@/components/ui/tabs";

import ProductOverview from "./sections/product-overview";
import ProductReviews from "./sections/product-reviews";
import ProductFaq from "./sections/product-faq";
import ProductChangelog from "./sections/product-changelog";

interface ProductTabsProps {
  framework: string;
  styling: string;
  components: number;
  version: string;
  lastUpdate: string;
  category: string;
  tags: string[];
  features: string[];

  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
}

export default function ProductTabs({
  framework,
  styling,
  components,
  version,
  lastUpdate,
  category,
  tags,
  features,
  changelog,
}: ProductTabsProps) {
  const t = useTranslations("ProductDetail");
  return (
    <Tabs
      items={[
        {
          id: "overview",
          label: t("overview"),
          content: (
            <ProductOverview
              framework={framework}
              styling={styling}
              components={components.toString()}
              version={version}
              lastUpdate={lastUpdate}
              category={category}
              tags={tags}
              features={features}
            />
          ),
        },
        {
          id: "reviews",
          label: t("reviews"),
          content: <ProductReviews />,
        },
        {
          id: "faq",
          label: t("faq"),
          content: <ProductFaq />,
        },
        {
          id: "changelog",
          label: t("changelog"),
          content: (
            <ProductChangelog
              changelog={changelog}
            />
          ),
        },
      ]}
    />
  );
}