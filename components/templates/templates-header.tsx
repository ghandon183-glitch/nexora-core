"use client";

import SearchBar from "./search-bar";

interface Props {
  value: string;
  onSearch: (value: string) => void;
}

export default function TemplatesHeader({
  value,
  onSearch,
}: Props) {
  return (
    <div className="mb-16">

      <div className="text-center">

        <h1 className="text-5xl font-black text-white">
          Browse Templates
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          Premium Next.js templates crafted for startups,
          agencies and modern SaaS products.
        </p>

      </div>

      <div className="mx-auto mt-10 max-w-2xl">

        <SearchBar
          value={value}
          onChange={onSearch}
        />

      </div>

    </div>
  );
}