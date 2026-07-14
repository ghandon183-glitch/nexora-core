"use client";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function PriceSlider({
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-5">

      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Max Price
      </h3>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Maximum price"
        aria-valuetext={`$${value}`}
        className="w-full accent-cyan-400"
      />

      <div className="flex justify-between text-sm text-slate-400">

        <span>$0</span>

        <span>${value}</span>

      </div>

    </div>
  );
}