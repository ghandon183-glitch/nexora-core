"use client";

import { useState } from "react";

interface TemplateSearchProps {
  onSearch: (value: string) => void;
}

export default function TemplateSearch({
  onSearch,
}: TemplateSearchProps) {
  const [value, setValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const keyword = e.target.value;

    setValue(keyword);

    onSearch(keyword);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search templates..."
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-white/5
          px-6
          py-4
          text-white
          outline-none
          backdrop-blur-xl
          transition-all
          duration-300
          placeholder:text-slate-500
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-500/20
        "
      />
    </div>
  );
}