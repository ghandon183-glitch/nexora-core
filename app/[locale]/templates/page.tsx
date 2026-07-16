"use client";

import { useMemo, useState } from "react";

import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import PageGlow from "@/components/ui/page-glow";

import TemplatesHeader from "@/components/templates/templates-header";
import TemplatesGrid from "@/components/templates/templates-grid";
import SortFilter from "@/components/templates/sort-filter";
import Pagination from "@/components/templates/pagination";

import FilterSidebar from "@/components/filters/filter-sidebar";

import { SearchQuery } from "@/lib/queries/search.query";

const ITEMS_PER_PAGE = 6;

export default function TemplatesPage() {
  const [keyword, setKeyword] = useState("");

  const [category, setCategory] = useState("All");

  const [framework, setFramework] = useState("All");

  const [price, setPrice] = useState(100);

  const [sort, setSort] = useState("Newest");

  const [currentPage, setCurrentPage] = useState(1);

  const filteredTemplates = useMemo(() => {
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const templates = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;

    return filteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTemplates, safePage]);

  function handleFilterChange<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setCurrentPage(1);
    };
  }

  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="cyan" />
        <div className="mx-auto max-w-7xl">

          <TemplatesHeader
            value={keyword}
            onSearch={handleFilterChange(setKeyword)}
          />

          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">

            <FilterSidebar
              category={category}
              framework={framework}
              price={price}
              onCategoryChange={handleFilterChange(setCategory)}
              onFrameworkChange={handleFilterChange(setFramework)}
              onPriceChange={handleFilterChange(setPrice)}
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

              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />

            </div>

          </div>

        </div>
      </Section>
    </>
  );
}