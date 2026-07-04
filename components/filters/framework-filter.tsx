"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const frameworks = [
  "All",
  "Next.js",
  "React",
  "Vue",
];

export default function FrameworkFilter({
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">

      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Framework
      </h3>

      {frameworks.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`flex w-full rounded-xl px-4 py-3 transition

          ${
            value === item
              ? "bg-cyan-500 text-black"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {item}
        </button>
      ))}

    </div>
  );
}