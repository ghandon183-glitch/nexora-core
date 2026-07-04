"use client";

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
  return (
    <Tabs
      items={[
        {
          id: "overview",
          label: "Overview",
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
          label: "Reviews",
          content: <ProductReviews />,
        },
        {
          id: "faq",
          label: "FAQ",
          content: <ProductFaq />,
        },
        {
          id: "changelog",
          label: "Changelog",
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