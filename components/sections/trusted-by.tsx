const companies = [
  "Google",
  "Stripe",
  "Vercel",
  "GitHub",
  "Notion",
  "OpenAI",
];

export default function TrustedBy() {
  return (
    <section className="relative border-y border-white/5 bg-[#070D1C] py-16">
      <div className="mx-auto max-w-7xl px-8">

        <p className="text-center text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
          Trusted By Modern Teams
        </p>

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">

          {companies.map((company) => (
            <div
              key={company}
              className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10"
            >
              {company}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}