"use client";

import { templates } from "@/lib/data/templates";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  "All",
  ...Array.from(new Set(templates.map((t) => t.category))),
];

export default function CategoryFilter({
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">

      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Categories
      </h3>

      {categories.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition

          ${
            value === item
              ? "bg-cyan-500 text-black"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <span>{item}</span>

          <span className="text-xs opacity-70">
            {item === "All" ? "" : "•"}
          </span>
        </button>
      ))}

    </div>
  );
}