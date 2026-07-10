import Link from "next/link";

import Button from "@/components/ui/button";
import Reveal from "@/components/ui/reveal";
import { templates } from "@/lib/data/templates";

export default function Pricing() {
  return (
    <section className="py-32">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal className="text-center">

          <span className="rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-orange-500/10 px-5 py-2 text-sm text-amber-300">
            Pricing
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            One-Time Payment. No Subscriptions.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Pick a template, pay once, and it&apos;s yours for good — lifetime
            updates and a commercial license included, no recurring charges
            ever.
          </p>

        </Reveal>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {templates.map((template, i) => {
            const popular = template.badge === "Popular";

            return (
              <Reveal key={template.slug} delay={i * 0.1}>
                <div
                  className={`rounded-3xl border p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 ${
                    popular
                      ? "border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-orange-500/5 shadow-lg shadow-amber-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >

                  {popular && (
                    <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2 text-sm font-semibold text-black">
                      Best Value
                    </div>
                  )}

                  <h3 className="text-3xl font-bold text-white">
                    {template.title}
                  </h3>

                  <div className="mt-6 text-5xl font-black text-white">
                    ${template.price}
                    <span className="ml-2 text-base font-normal text-gray-500">
                      one-time
                    </span>
                  </div>

                  <p className="mt-4 text-gray-400">
                    {template.description}
                  </p>

                  <ul className="mt-8 space-y-4">

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      {template.components}+ Components
                    </li>

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      Lifetime Updates
                    </li>

                    <li className="flex items-center gap-3 text-gray-300">
                      <span className="text-cyan-400">✓</span>
                      Commercial License
                    </li>

                  </ul>

                  <Link href={`/templates/${template.slug}`} className="mt-10 block">
                    <Button
                      variant={popular ? "gradient" : "outline"}
                      className="w-full"
                    >
                      View {template.title}
                    </Button>
                  </Link>

                </div>
              </Reveal>
            );
          })}

        </div>

        <Reveal className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl md:flex-row md:text-left">

          <div>
            <h3 className="text-xl font-bold text-white">
              No subscriptions. No hidden tiers. Ever.
            </h3>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Every template is a single, one-time payment via crypto —
              that&apos;s the whole pricing model.
            </p>
          </div>

          <Link href="/pricing">
            <Button variant="outline" className="whitespace-nowrap">
              See Full Pricing Details
            </Button>
          </Link>

        </Reveal>

      </div>
    </section>
  );
}
