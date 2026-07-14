import Link from "next/link";

import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import PageGlow from "@/components/ui/page-glow";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";

import { templates } from "@/lib/data/templates";

const steps = [
  {
    title: "1. Purchase a template",
    body:
      "Choose a template from the marketplace and complete checkout. Payment is a one-time crypto payment, confirmed manually — there's no subscription.",
  },
  {
    title: "2. Get the source code",
    body:
      "Once your payment is confirmed, the template's full source code is unlocked in your dashboard under \"My Purchases.\"",
  },
  {
    title: "3. Install dependencies",
    body:
      "Unzip the project, then run npm install (or your package manager of choice) inside the project folder to install all dependencies.",
  },
  {
    title: "4. Run it locally",
    body:
      "Run npm run dev and open http://localhost:3000 to see the template running on your machine.",
  },
  {
    title: "5. Customize and deploy",
    body:
      "Update the content, colors, and copy to match your brand, then deploy to any platform that supports Next.js.",
  },
];

const faqs = [
  {
    question: "Do I need a Next.js or React background?",
    answer:
      "Basic familiarity with React and Tailwind CSS helps, but every template ships with clear component names and structure so non-experts can still make simple edits.",
  },
  {
    question: "Can I use a template for client projects?",
    answer:
      "Yes. Every purchase includes a commercial license, so you can use the template in your own projects or client work.",
  },
  {
    question: "Do updates cost extra?",
    answer:
      "No. All future updates to a template you've purchased are included at no extra cost.",
  },
  {
    question: "What if I need help?",
    answer:
      "Reach out through the contact details on the checkout confirmation, and we'll help you get unblocked.",
  },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />

      <Section>
        <PageGlow variant="emerald" />
        <div className="mx-auto max-w-5xl">

          <Heading
            badge="Docs"
            title="Getting started"
            description="Everything you need to go from purchase to a running, customized site."
            align="center"
            accent="emerald"
          />

          <div className="mt-16 space-y-6">
            {steps.map((step) => (
              <Card
                key={step.title}
                className="p-8 hover:-translate-y-0 hover:border-white/10"
              >
                <h3 className="text-lg font-bold text-white">
                  {step.title}
                </h3>

                <p className="mt-2 text-slate-400">
                  {step.body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-20">

            <h2 className="text-2xl font-bold text-white">
              Template-specific documentation
            </h2>

            <p className="mt-3 text-slate-400">
              Each template also ships with its own README covering its
              specific folder structure and configuration.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {templates.map((template) => (
                <Link
                  key={template.slug}
                  href={`/templates/${template.slug}`}
                  className="block"
                >
                  <Card className="p-6 hover:-translate-y-1 hover:border-cyan-400/30">
                    <Badge>{template.category}</Badge>

                    <p className="mt-4 font-bold text-white">
                      {template.title}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      View template & docs →
                    </p>
                  </Card>
                </Link>
              ))}
            </div>

          </div>

          <div className="mt-20">

            <h2 className="text-2xl font-bold text-white">
              FAQ
            </h2>

            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <Card
                  key={faq.question}
                  className="p-6 hover:-translate-y-0 hover:border-white/10"
                >
                  <p className="font-semibold text-white">
                    {faq.question}
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {faq.answer}
                  </p>
                </Card>
              ))}
            </div>

          </div>

        </div>
      </Section>
    </>
  );
}
