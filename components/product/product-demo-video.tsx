export default function ProductDemoVideo({ src, demoUrl }: { src?: string; demoUrl?: string }) {
  if (!src) return null;

  // The shipped AETHER walkthrough was captured from a broken page.
  // Show the actual deployed experience instead of a blank/incorrect recording.
  const isAether = src.includes("/aether/") && demoUrl?.includes("nexora-aether-demo.nxora.workers.dev");

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
          {isAether ? "Live interactive preview" : "Real product walkthrough"}
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          {isAether ? "Explore AETHER live" : "See the template running"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isAether
            ? "Explore the deployed AETHER experience directly below. Open it in a new tab for the full-screen experience."
            : "Recorded from the shipped demo build. This is the actual interface, not a concept render."}
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        {isAether && demoUrl ? (
          <>
            <iframe
              title="AETHER live interactive demo"
              src={demoUrl}
              className="aspect-video w-full bg-[#080808]"
              loading="lazy"
              allow="fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="border-t border-white/10 p-4 text-right">
              <a
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
              >
                Open full live demo ↗
              </a>
            </div>
          </>
        ) : (
          <video className="aspect-video w-full" controls playsInline preload="metadata" src={src} />
        )}
      </div>
    </section>
  );
}
