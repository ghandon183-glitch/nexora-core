"use client";

import Link from "next/link";

const links = [
  { label: "Home", href: "/" },
  { label: "Components", href: "#", disabled: true },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "#", disabled: true },
  { label: "Docs", href: "#", disabled: true },
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-5 flex h-16 w-[94%] max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 px-6 backdrop-blur-2xl">

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 font-black text-black">
            N
          </div>

          <div>
            <h2 className="text-lg font-bold tracking-wide text-white">
              NEXORA
            </h2>

            <p className="-mt-1 text-xs text-slate-400">
              Premium UI Kit
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) =>
            item.disabled ? (
              <span
                key={item.label}
                title="Coming soon"
                className="cursor-not-allowed text-sm text-slate-600"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-slate-300 transition hover:text-cyan-400"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">

          <Link
            href="/sign-in"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition hover:border-cyan-400 hover:bg-white/5"
          >
            Login
          </Link>

          <Link
            href="/sign-up"
            className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-black transition hover:scale-105"
          >
            Get Started
          </Link>

        </div>

      </div>
    </header>
  );
}