import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";

const sections = [
  {
    title: "1. What you're buying",
    body: "Each purchase gives you a license to use the purchased template's source code in your own personal or commercial projects, including projects built for clients. You may modify the code freely.",
  },
  {
    title: "2. What you can't do",
    body: "You may not resell, redistribute, or sublicense a template's source code as a standalone product or template — for example, uploading it to another template marketplace. You may not claim authorship of the original template design.",
  },
  {
    title: "3. Payment",
    body: "Payment is currently accepted as a one-time cryptocurrency payment sent to the wallet address shown at checkout. Purchases are verified manually rather than automatically, so there may be a short delay between payment and confirmation.",
  },
  {
    title: "4. Refunds",
    body: "Because templates are digital goods delivered as source code, all sales are final once a purchase is confirmed and delivered. If a template doesn't work as described, reach out through the contact page and we'll do our best to resolve it.",
  },
  {
    title: "5. Updates",
    body: "Purchased templates include free access to future updates released for that template, for as long as the template remains part of the catalog.",
  },
  {
    title: "6. No warranty",
    body: "Templates are provided \"as is,\" without warranty of any kind. We aren't liable for damages arising from the use of a purchased template.",
  },
  {
    title: "7. Changes to these terms",
    body: "These terms may be updated from time to time. Continued use of the site after a change means you accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <Section>
        <div className="mx-auto max-w-3xl">

          <Heading
            badge="Terms"
            title="Terms of Service"
            description="Last updated July 2026. These terms apply whenever you purchase or use a template from Nexora Core."
            align="center"
          />

          <div className="mt-16 space-y-6">
            {sections.map((section) => (
              <Card
                key={section.title}
                className="p-8 hover:-translate-y-0 hover:border-white/10"
              >
                <h3 className="text-lg font-bold text-white">
                  {section.title}
                </h3>

                <p className="mt-3 text-slate-400">
                  {section.body}
                </p>
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-600">
            These terms are a general starting point and aren&apos;t a
            substitute for legal advice. If you have specific legal or
            regulatory requirements, have them reviewed by a legal
            professional.
          </p>

        </div>
      </Section>
    </>
  );
}
