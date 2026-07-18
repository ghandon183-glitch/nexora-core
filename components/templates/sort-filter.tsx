"use client";

import { useTranslations } from "next-intl";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SortFilter({
  value,
  onChange,
}: Props) {
  const t = useTranslations("TemplatesPage");
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t("sortLabel")}
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
      <option value="Newest">{t("sortNewest")}</option>
      <option value="Popular">{t("sortPopular")}</option>
      <option value="Price Low">{t("sortPriceLow")}</option>
      <option value="Price High">{t("sortPriceHigh")}</option>
    </select>
  );
}