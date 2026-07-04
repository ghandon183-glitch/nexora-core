"use client";

import { useState } from "react";

const categories = [
  "All",
  "Landing",
  "Dashboard",
  "Portfolio",
  "Ecommerce",
  "Admin",
  "Blog",
];

const sorts = [
  "Newest",
  "Popular",
  "Premium",
  "Free",
];

export default function TemplateFilters() {
  const [active, setActive] = useState("All");

  return (
    <div className="mb-12 space-y-8">

      <div className="flex flex-wrap gap-3">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`rounded-full px-5 py-2 transition-all duration-300 border
            ${
              active === item
                ? "bg-cyan-500 border-cyan-500 text-black"
                : "bg-white/5 border-white/10 text-gray-300 hover:border-cyan-400"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">

        <select
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        >
          {sorts.map((item) => (
            <option
              key={item}
              value={item}
              className="bg-slate-900"
            >
              {item}
            </option>
          ))}
        </select>

        <button className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 hover:border-cyan-400 transition">
          Premium
        </button>

        <button className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 hover:border-cyan-400 transition">
          Free
        </button>

        <button className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 hover:border-cyan-400 transition">
          Tailwind
        </button>

        <button className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 hover:border-cyan-400 transition">
          Next.js
        </button>

      </div>
    </div>
  );
}