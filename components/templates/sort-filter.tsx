"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SortFilter({
  value,
  onChange,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sort templates by"
      className="
        rounded-xl
        border
        border-slate-700
        bg-slate-900
        px-4
        py-2
        text-white
      "
    >
      <option value="Newest">Newest</option>
      <option value="Popular">Popular</option>
      <option value="Price Low">Price Low</option>
      <option value="Price High">Price High</option>
    </select>
  );
}