"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

import { useAuth } from "@/lib/context/auth-context";
import LanguageSwitcher from "@/components/navigation/language-switcher";
import LogoMark from "@/components/ui/logo-mark";

export default function Navbar() {
  const t = useTranslations("Nav");
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const links = [
    { label: t("home"), href: "/" },
    { label: t("components"), href: "/components" },
    { label: t("templates"), href: "/templates" },
    { label: t("pricing"), href: "/pricing" },
    { label: t("docs"), href: "/docs" },
  ];

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-5 flex h-16 w-[94%] max-w-7xl items-center justify-between rounded-2xl border border-[#d9b06c]/15 bg-[#1a1008]/85 px-6 shadow-[0_18px_60px_rgba(0,0,0,.18)] backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0b76e] to-[#8c5f2d] p-2 text-[#160c03] shadow-[0_8px_24px_rgba(199,154,87,.2)]">
            <LogoMark className="h-full w-full" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-[#f6efe1]">NEXORA</h2>
            <p className="-mt-1 text-xs text-[#a89878]">{t("tagline")}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm text-[#b9aa91] transition hover:text-[#e0b76e]">
              {item.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div className="flex items-center gap-3"><LanguageSwitcher /><div className="h-10 w-10" /></div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="relative">
              <button onClick={() => setMenuOpen((open) => !open)} className="flex items-center gap-3 rounded-xl border border-[#d9b06c]/15 bg-[#211408]/60 px-3 py-2 transition hover:border-[#d9b06c]/40 hover:bg-[#2b1b0d]">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c79a57] text-sm font-bold text-[#1a0e03]">{user.name.charAt(0).toUpperCase()}</div>
                <span className="text-sm text-[#f6efe1]">{user.name}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#d9b06c]/15 bg-[#1a1008] p-2 shadow-2xl">
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-[#b9aa91] transition hover:bg-[#2b1b0d] hover:text-[#f6efe1]">{t("dashboard")}</Link>
                  <button onClick={handleSignOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#b9aa91] transition hover:bg-[#2b1b0d] hover:text-[#f6efe1]">{t("signOut")}</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/sign-in" className="rounded-xl border border-[#d9b06c]/15 px-4 py-2 text-sm text-[#f6efe1] transition hover:border-[#d9b06c]/40 hover:bg-[#2b1b0d]">{t("login")}</Link>
            <Link href="/sign-up" className="rounded-xl bg-[#c79a57] px-5 py-2 text-sm font-semibold text-[#1a0e03] shadow-[0_8px_24px_rgba(199,154,87,.16)] transition hover:bg-[#e0b76e] hover:scale-[1.03]">{t("getStarted")}</Link>
          </div>
        )}
      </div>
    </header>
  );
}
