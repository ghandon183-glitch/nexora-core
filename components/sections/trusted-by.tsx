import { useTranslations } from "next-intl";
import Reveal from "@/components/ui/reveal";

const stack = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "React",
  "Framer Motion",
  "Resend",
];

export default function TrustedBy() {
  const t = useTranslations("TrustedBy");
  return (
    <section className="relative border-y border-white/5 py-16">
      <div className="mx-auto max-w-7xl px-8">

        <Reveal>
          <p className="text-center text-sm font-medium uppercase tracking-[0.35em] text-slate-500">
            {t("heading")}
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">

          {stack.map((tool, i) => (
            <Reveal key={tool} delay={i * 0.06} y={16}>
              <div className="flex h-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-semibold text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
                {tool}
              </div>
            </Reveal>
          ))}

        </div>

      </div>
    </section>
  );
}
