"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/context/auth-context";

const links = [
  { label: "Home", href: "/" },
  { label: "Components", href: "/components" },
  { label: "Templates", href: "/templates" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    router.push("/");
  }

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
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-slate-300 transition hover:text-cyan-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {loading ? (
          <div className="h-10 w-10" />
        ) : user ? (
          <div className="relative">

            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 transition hover:border-cyan-400 hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-bold text-black">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <span className="text-sm text-white">
                {user.name}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-950 p-2 shadow-xl">

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleSignOut}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                  Sign Out
                </button>

              </div>
            )}

          </div>
        ) : (
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
        )}

      </div>
    </header>
  );
}