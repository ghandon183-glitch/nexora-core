import Reveal from "@/components/ui/reveal";
import Card from "@/components/ui/card";

export default function Testimonials() {
  const reasons = [
    {
      title: "Real, Working Code",
      text: "Every template ships as a complete Next.js project you can clone and run locally in minutes — not a static mockup.",
      glow: "violet" as const,
    },
    {
      title: "One-Time Payment",
      text: "No subscriptions, no recurring fees. Pay once via crypto and the template is yours to keep, forever.",
      glow: "amber" as const,
    },
    {
      title: "Actively Maintained",
      text: "Nexora Core is a small, independently run marketplace — built and maintained by someone who actually uses these templates.",
      glow: "cyan" as const,
    },
  ];

  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">

          <span className="rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-5 py-2 text-sm text-violet-200">
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
              <Card glow={item.glow} className="p-8">

                <h3 className="text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-4 leading-8 text-gray-300">
                  {item.text}
                </p>

              </Card>
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}
