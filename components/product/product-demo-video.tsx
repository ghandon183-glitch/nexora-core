export default function ProductDemoVideo({ src }: { src?: string }) {
  if (!src) return null;
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Real product walkthrough</p>
        <h2 className="mt-2 text-2xl font-black text-white">See the template running</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Recorded from the shipped demo build. This is the actual interface, not a concept render.</p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <video className="aspect-video w-full" controls playsInline preload="metadata" src={src} />
      </div>
    </section>
  );
}