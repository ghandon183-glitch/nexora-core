"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import Card from "@/components/ui/card";

export default function ProductFaq() {
  const t = useTranslations("ProductDetail");
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
  ];

  return (
    <section className="space-y-8">

      <div>
        <h2 className="text-4xl font-bold text-white">
          {t("faqTitle")}
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          {t("faqSubtitle")}
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
