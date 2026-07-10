import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <Section>
        <div className="mx-auto max-w-3xl">

          <Heading
            badge="About"
            title="Building templates we'd actually want to use"
            description="Nexora Core is a small marketplace of premium Next.js templates and UI components."
            align="center"
          />

          <div className="mt-16 space-y-6">

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                What we build
              </h3>

              <p className="mt-3 text-slate-400">
                Every template on Nexora Core is built with Next.js and
                Tailwind CSS, designed to be readable and easy to customize
                rather than over-engineered. Each one ships with clean
                component names, a consistent folder structure, and lifetime
                updates.
              </p>
            </Card>

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                How purchases work
              </h3>

              <p className="mt-3 text-slate-400">
                Payments are currently accepted as a one-time crypto payment,
                confirmed manually. There are no subscriptions — buy a
                template once and it&apos;s yours, along with any future
                updates.
              </p>
            </Card>

            <Card className="p-8 hover:-translate-y-0 hover:border-white/10">
              <h3 className="text-lg font-bold text-white">
                Where we are today
              </h3>

              <p className="mt-3 text-slate-400">
                Nexora Core is an early-stage, independently run project. The
                template catalog and component library are actively growing.
                If you run into an issue or have feedback, the{" "}
                <a href="/contact" className="text-cyan-400 hover:underline">
                  contact page
                </a>{" "}
                is the fastest way to reach us.
              </p>
            </Card>

          </div>

        </div>
      </Section>
    </>
  );
}
