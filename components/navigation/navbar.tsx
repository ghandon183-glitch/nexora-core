"use client";

const links = [
  "Home",
  "Components",
  "Templates",
  "Pricing",
  "Docs",
];

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-5 flex h-16 w-[94%] max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 px-6 backdrop-blur-2xl">

        <div className="flex items-center gap-3">
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
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-slate-300 transition hover:text-cyan-400"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">

          <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition hover:border-cyan-400 hover:bg-white/5">
            Login
          </button>

          <button className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-black transition hover:scale-105">
            Get Started
          </button>

        </div>

      </div>
    </header>
  );
}