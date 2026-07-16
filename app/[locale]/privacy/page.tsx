import Navbar from "@/components/navigation/navbar";

import Section from "@/components/ui/section";
import Heading from "@/components/ui/heading";
import Card from "@/components/ui/card";

const sections = [
  {
    title: "What we store",
    body: [
      "Account details (your name and email) and your list of purchased templates are currently stored locally in your browser, not in a company database. This means they stay on the device and browser you signed in with, and won't follow you to a different device or browser.",
    ],
  },
  {
    title: "Payment information",
    body: [
      "We do not collect or store card numbers, bank details, or wallet private keys. Checkout works by sending a crypto payment to a published wallet address, then clicking a confirmation button. That confirmation is currently sent to us by email so we can verify the payment and follow up with you.",
    ],
  },
  {
    title: "Contact form",
    body: [
      "If you use the contact form, your name, email, and message are sent to us by email so we can reply to you. We don't store contact form submissions in a database beyond that email.",
    ],
  },
  {
    title: "Cookies and analytics",
    body: [
      "We do not currently use cookies, tracking pixels, or third-party analytics on this site.",
    ],
  },
  {
    title: "Third parties",
    body: [
      "We use Resend, an email delivery service, to send account and purchase-related emails. We do not sell or share your information with advertisers.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Because your account and purchase data live in your browser's local storage, you can clear them at any time by clearing your browser's site data for this domain. If you'd like us to delete any information you've sent us by email (for example, through the contact form), reach out on the contact page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <Section>
        <div className="mx-auto max-w-3xl">

          <Heading
            badge="Privacy"
            title="Privacy Policy"
            description="Last updated July 2026. This describes, in plain language, what information Nexora Core collects and how it's used."
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

                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-slate-400">
                    {paragraph}
                  </p>
                ))}
              </Card>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-slate-600">
            This policy describes how the site currently works and isn&apos;t
            a substitute for legal advice. If you have specific compliance
            requirements, have it reviewed by a legal professional.
          </p>

        </div>
      </Section>
    </>
  );
}
