"use client";

import { useTranslations } from "next-intl";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  const t = useTranslations("TemplatesPage");
  return (
    <div className="w-full">
      <input
        type="search"
        aria-label={t("searchLabel")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="
          h-14
          w-full
          rounded-xl
          border
          border-cyan-500/30
          bg-slate-900/70
          px-5
          text-white
          placeholder:text-slate-500
          outline-none
          transition
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-500/30
        "
      />
    </div>
  );
}