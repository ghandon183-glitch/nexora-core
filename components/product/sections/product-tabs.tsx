"use client";

import * as Tabs from "@radix-ui/react-tabs";

import ProductOverview from "./product-overview";
import ProductReviews from "./product-reviews";
import ProductFaq from "./product-faq";
import ProductChangelog from "./product-changelog";

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
    <Tabs.Root
      defaultValue="overview"
      className="space-y-8"
    >
      <Tabs.List className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">

        <Tab value="overview">
          Overview
        </Tab>

        <Tab value="reviews">
          Reviews
        </Tab>

        <Tab value="faq">
          FAQ
        </Tab>

        <Tab value="changelog">
          Changelog
        </Tab>

      </Tabs.List>

      <Tabs.Content value="overview">
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
      </Tabs.Content>

      <Tabs.Content value="reviews">
        <ProductReviews />
      </Tabs.Content>

      <Tabs.Content value="faq">
        <ProductFaq />
      </Tabs.Content>

      <Tabs.Content value="changelog">
        <ProductChangelog
          changelog={changelog}
        />
      </Tabs.Content>

    </Tabs.Root>
  );
}

function Tab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className="rounded-xl px-6 py-3 text-slate-300 transition data-[state=active]:bg-cyan-500 data-[state=active]:font-semibold data-[state=active]:text-black"
    >
      {children}
    </Tabs.Trigger>
  );
}