import Reveal from "@/components/ui/reveal";

export default function CTA() {
  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-6xl px-8">

        <Reveal className="rounded-[40px] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-16 text-center backdrop-blur-xl">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            Ready to build?
          </span>

          <h2 className="mt-8 text-5xl font-black text-white">
            Start Building Faster Today
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Join thousands of developers using Nexora to build beautiful
            websites, SaaS platforms and premium user interfaces.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-6">

            <button className="rounded-xl bg-cyan-500 px-8 py-4 font-bold text-black transition hover:scale-105">
              Explore Templates
            </button>

            <button className="rounded-xl border border-white/20 px-8 py-4 font-bold text-white transition hover:bg-white/10">
              View Components
            </button>

          </div>

        </Reveal>

      </div>
    </section>
  );
}
