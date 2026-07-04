"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import Card from "@/components/ui/card";

const faqs = [
  {
    question: "Can I use this template for commercial projects?",
    answer:
      "Yes. You can use this template for unlimited commercial projects according to the license.",
  },
  {
    question: "Will I receive future updates?",
    answer:
      "Yes. Every purchase includes lifetime updates at no additional cost.",
  },
  {
    question: "Does it support Next.js 15?",
    answer:
      "Yes. The template is built specifically for the latest Next.js App Router.",
  },
  {
    question: "Is support included?",
    answer:
      "Yes. Premium support is included and we'll continue fixing bugs and improving the template.",
  },
];

export default function ProductFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="space-y-8">

      <div>
        <h2 className="text-4xl font-bold text-white">
          Frequently Asked Questions
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          Everything you need to know before purchasing.
        </p>
      </div>

      <div className="space-y-4">

        {faqs.map((faq, index) => (
          <Card
            key={index}
            className="overflow-hidden p-0"
          >
            <button
              type="button"
              onClick={() =>
                setOpen(open === index ? null : index)
              }
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <span className="text-lg font-semibold text-white">
                {faq.question}
              </span>

              <ChevronDown
                className={`transition duration-300 ${
                  open === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {open === index && (
              <div className="border-t border-white/10 px-6 pb-6 pt-4">
                <p className="leading-8 text-slate-400">
                  {faq.answer}
                </p>
              </div>
            )}
          </Card>
        ))}

      </div>

    </section>
  );
}