"use client";

import { useState } from "react";

export interface AccordionItem {
  question: string;
  answer: string;
}

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-semibold text-white">{item.question}</span>
              <span
                className={`shrink-0 text-xl text-cyan-400 transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
