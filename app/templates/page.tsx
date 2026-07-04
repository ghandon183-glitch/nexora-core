"use client";

import { useMemo, useState } from "react";

import Navbar from "@/components/navigation/navbar";
import Sidebar from "@/components/navigation/sidebar";
import FloatingDock from "@/components/navigation/floating-dock";

import Section from "@/components/ui/section";

import TemplatesHeader from "@/components/templates/templates-header";
import TemplatesGrid from "@/components/templates/templates-grid";
import SortFilter from "@/components/templates/sort-filter";

import FilterSidebar from "@/components/filters/filter-sidebar";

import { SearchQuery } from "@/lib/queries/search.query";

export default function TemplatesPage() {
  const [keyword, setKeyword] = useState("");

  const [category, setCategory] = useState("All");

  const [framework, setFramework] = useState("All");

  const [price, setPrice] = useState(100);

  const [sort, setSort] = useState("Newest");

  const templates = useMemo(() => {
    let data = SearchQuery.search(keyword);

    data = data.filter((item) => {
      const categoryOk =
        category === "All" || item.category === category;

      const frameworkOk =
        framework === "All" ||
        item.framework.includes(framework);

      const priceOk = item.price <= price;

      return categoryOk && frameworkOk && priceOk;
    });

    switch (sort) {
      case "Price Low":
        data = [...data].sort((a, b) => a.price - b.price);
        break;

      case "Price High":
        data = [...data].sort((a, b) => b.price - a.price);
        break;

      default:
        break;
    }

    return data;
  }, [
    keyword,
    category,
    framework,
    price,
    sort,
  ]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <FloatingDock />

      <Section>
        <div className="mx-auto max-w-7xl">

          <TemplatesHeader
            value={keyword}
            onSearch={setKeyword}
          />

          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">

            <FilterSidebar
              category={category}
              framework={framework}
              price={price}
              onCategoryChange={setCategory}
              onFrameworkChange={setFramework}
              onPriceChange={setPrice}
            />

            <div>

              <div className="mb-8 flex justify-end">
                <SortFilter
                  value={sort}
                  onChange={setSort}
                />
              </div>

              <TemplatesGrid
                templates={templates}
              />

            </div>

          </div>

        </div>
      </Section>
    </>
  );
}