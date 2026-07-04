"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  "All",
  "Landing",
  "Dashboard",
  "Portfolio",
  "Ecommerce",
  "Admin",
  "Blog",
];

export default function CategoryFilter({
  value,
  onChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`rounded-full px-4 py-2 text-sm transition

          ${
            value === item
              ? "bg-cyan-500 text-black"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}