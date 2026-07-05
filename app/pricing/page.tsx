import Link from "next/link";

import Navbar from "@/components/navigation/navbar";
import FloatingDock from "@/components/navigation/floating-dock";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

import { templates } from "@/lib/data/templates";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <FloatingDock />

      <Section>
        <div className="mx-auto max-w-7xl">

          <Heading
            badge="Pricing"
            title="One template, one price"
            description="No subscriptions and no hidden tiers. Pick a template, pay once, and it's yours — with lifetime updates and a commercial license included."
            align="center"
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">

            {templates.map((template) => (
              <Card
                key={template.slug}
                className="flex h-full flex-col p-8"
              >

                <Badge>
                  {template.badge}
                </Badge>

                <h3 className="mt-6 text-2xl font-bold text-white">
                  {template.title}
                </h3>

                <p className="mt-3 text-sm text-slate-400">
                  {template.description}
                </p>

                <div className="mt-8 text-5xl font-black text-white">
                  ${template.price}
                  <span className="ml-2 text-base font-normal text-slate-500">
                    one-time
                  </span>
                </div>

                <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-300">

                  <li className="flex items-center gap-3">
                    <span className="text-cyan-400">✓</span>
                    {template.components}+ components
                  </li>

                  <li className="flex items-center gap-3">
                    <span className="text-cyan-400">✓</span>
                    Built with {template.framework}
                  </li>

                  {template.features.slice(0, 3).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3"
                    >
                      <span className="text-cyan-400">✓</span>
                      {feature}
                    </li>
                  ))}

                  <li className="flex items-center gap-3">
                    <span className="text-cyan-400">✓</span>
                    Lifetime updates
                  </li>

                  <li className="flex items-center gap-3">
                    <span className="text-cyan-400">✓</span>
                    Commercial license
                  </li>

                </ul>

                <Link
                  href={`/templates/${template.slug}`}
                  className="mt-8 block"
                >
                  <Button className="w-full">
                    View {template.title}
                  </Button>
                </Link>

              </Card>
            ))}

          </div>

          <Card className="mt-10 flex flex-col items-center gap-4 p-10 text-center hover:-translate-y-0 hover:border-white/10 md:flex-row md:justify-between md:text-left">

            <div>
              <h3 className="text-xl font-bold text-white">
                Payment is currently crypto-only
              </h3>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Every purchase is a one-time payment sent to a wallet address
                during checkout, confirmed manually. No recurring charges,
                ever.
              </p>
            </div>

            <Link href="/templates">
              <Button variant="outline" className="whitespace-nowrap">
                Browse All Templates
              </Button>
            </Link>

          </Card>

        </div>
      </Section>
    </>
  );
}
