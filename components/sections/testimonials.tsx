import Reveal from "@/components/ui/reveal";

export default function Testimonials() {
  const reasons = [
    {
      title: "Real, Working Code",
      text: "Every template ships as a complete Next.js project you can clone and run locally in minutes — not a static mockup.",
    },
    {
      title: "One-Time Payment",
      text: "No subscriptions, no recurring fees. Pay once via crypto and the template is yours to keep, forever.",
    },
    {
      title: "Actively Maintained",
      text: "Nexora Core is a small, independently run marketplace — built and maintained by someone who actually uses these templates.",
    },
  ];

  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            Why Nexora Core
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            A Small, Honest Alternative
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            No bloated subscription plans and no fake customer counts —
            just real templates and a straightforward, one-time price.
          </p>

        </Reveal>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {reasons.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1}>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition hover:-translate-y-2">

                <h3 className="text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-300">
                  {item.text}
                </p>

              </div>
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}
