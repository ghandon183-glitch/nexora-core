import Link from "next/link";

import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/input";
import FeatureCard from "@/components/ui/feature-card";

export default function ComponentsShowcase() {
  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <div className="text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            UI Components
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            Real Components, Not Mockups
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            The same buttons, cards, and inputs shown below are the ones that
            actually ship inside every template &mdash; live, not screenshots.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
            <h3 className="text-xl font-bold text-white">Buttons</h3>
            <p className="mt-2 text-sm text-gray-400">
              Primary, outline, and ghost variants.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-6">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
            <h3 className="text-xl font-bold text-white">Badges</h3>
            <p className="mt-2 text-sm text-gray-400">
              Default, success, and warning states.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-6">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30">
            <h3 className="text-xl font-bold text-white">Inputs</h3>
            <p className="mt-2 text-sm text-gray-400">
              Styled focus rings and placeholder states.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
              <Input placeholder="you@example.com" />
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <FeatureCard
              title="Feature Cards"
              description="Icon-slot cards used across dashboards and marketing sections."
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-400/30 md:col-span-2">
            <h3 className="text-xl font-bold text-white">And more</h3>
            <p className="mt-2 text-sm text-gray-400">
              Tabs, template cards, and every other primitive that powers the
              three real templates &mdash; browse the full, live library.
            </p>
            <Link href="/components" className="mt-6 inline-block">
              <Button variant="outline">Explore All Components</Button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
