"use client";

import CategoryFilter from "./category-filter";
import FrameworkFilter from "./framework-filter";
import PriceSlider from "./price-slider";

interface FilterSidebarProps {
  category: string;
  framework: string;
  price: number;

  onCategoryChange: (value: string) => void;
  onFrameworkChange: (value: string) => void;
  onPriceChange: (value: number) => void;
}

export default function FilterSidebar({
  category,
  framework,
  price,
  onCategoryChange,
  onFrameworkChange,
  onPriceChange,
}: FilterSidebarProps) {
  return (
    <aside className="sticky top-24 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur-xl">

      <h2 className="mb-8 text-2xl font-bold text-white">
        Filters
      </h2>

      <CategoryFilter
        value={category}
        onChange={onCategoryChange}
      />

      <div className="my-8 h-px bg-slate-800" />

      <FrameworkFilter
        value={framework}
        onChange={onFrameworkChange}
      />

      <div className="my-8 h-px bg-slate-800" />

      <PriceSlider
        value={price}
        onChange={onPriceChange}
      />

    </aside>
  );
}