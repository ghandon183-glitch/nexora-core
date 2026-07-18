"use client";

import { useTranslations } from "next-intl";
import SearchBar from "./search-bar";

interface Props {
  value: string;
  onSearch: (value: string) => void;
}

export default function TemplatesHeader({
  value,
  onSearch,
}: Props) {
  const t = useTranslations("TemplatesPage");
  return (
    <div className="mb-16">

      <div className="text-center">

        <h1 className="text-5xl font-black text-white">
          {t("title")}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
          {t("description")}
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