import { notFound } from "next/navigation";

export default async function VesperPreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "vesper") notFound();

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="font-mono text-sm tracking-[.35em] text-cyan-300">VESPER</span>
          <nav className="hidden gap-7 text-sm text-slate-400 md:flex"><span>Platform</span><span>Studio</span><span>Pricing</span><span>Docs</span></nav>
          <a href="#studio" className="rounded-full border border-white/15 px-4 py-2 text-sm">Open Studio</a>
        </div>
      </header>
      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.16),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(139,92,246,.18),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[.35em] text-cyan-300">AI creative operating system</p>
            <h1 className="mt-6 text-6xl font-black leading-[.92] tracking-[-.05em] sm:text-8xl">Create at the speed of imagination.</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400">A cinematic premium SaaS experience for AI image, video, audio and creative workflows.</p>
            <div className="mt-10 flex gap-4"><a href="#studio" className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950">Enter Studio</a><a href="#features" className="rounded-full border border-white/15 px-6 py-3 font-semibold">Explore system</a></div>
          </div>
          <div id="studio" className="rounded-[2rem] border border-white/10 bg-white/[.035] p-4 shadow-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#080d19] p-5">
              <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.25em] text-slate-500">Studio workspace</p><p className="mt-1 font-semibold">Aurora Campaign / Scene 04</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Rendering</span></div>
              <div className="grid min-h-[390px] grid-cols-[1fr_170px] gap-4">
                <div className="rounded-2xl bg-[radial-gradient(circle_at_55%_45%,rgba(34,211,238,.45),transparent_22%),radial-gradient(circle_at_65%_55%,rgba(139,92,246,.35),transparent_34%),linear-gradient(135deg,#111827,#050812)] p-5">
                  <div className="flex h-full items-end"><div className="w-full rounded-xl border border-white/10 bg-black/30 p-4"><div className="h-2 w-2/3 rounded bg-white/20"/><div className="mt-3 h-2 w-1/2 rounded bg-cyan-300/50"/><div className="mt-5 h-1 rounded bg-white/10"><div className="h-1 w-3/5 rounded bg-cyan-300"/></div></div></div>
                </div>
                <div className="space-y-3"><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Prompt</p><p className="mt-2 text-sm text-slate-300">Nocturnal architecture, liquid light...</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Model</p><p className="mt-2 text-sm">Vesper Vision v4</p></div><div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-slate-500">Aspect</p><p className="mt-2 text-sm">16 : 9</p></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="border-t border-white/10 px-6 py-24"><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[.35em] text-cyan-300">Designed as a system</p><div className="mt-6 grid gap-6 md:grid-cols-3"><article className="rounded-3xl border border-white/10 p-8"><h2 className="text-xl font-bold">Cinematic hero</h2><p className="mt-3 text-sm leading-6 text-slate-400">Atmospheric motion language with responsive fallbacks.</p></article><article className="rounded-3xl border border-white/10 p-8"><h2 className="text-xl font-bold">Studio workspace</h2><p className="mt-3 text-sm leading-6 text-slate-400">Timeline, inspector and generation-state patterns.</p></article><article className="rounded-3xl border border-white/10 p-8"><h2 className="text-xl font-bold">Reusable UI kit</h2><p className="mt-3 text-sm leading-6 text-slate-400">Marketing sections and application chrome share one visual system.</p></article></div></div></section>
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-slate-500">Vesper — Premium AI Creative SaaS · React 19 · TypeScript · Vite · Tailwind CSS 4</footer>
    </main>
  );
}
