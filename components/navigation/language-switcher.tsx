"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe, ChevronDown } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  tr: "Türkçe",
  zh: "中文",
};

export default function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectLocale(nextLocale: string) {
    setOpen(false);
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("label")}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:bg-white/5 hover:text-white"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-slate-950 p-1.5 shadow-xl">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => selectLocale(loc)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                loc === locale
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
