import { useTranslations } from "next-intl";
import Reveal from "@/components/ui/reveal";

const bars = [35, 55, 45, 70, 65, 90, 75, 105, 98, 120, 132, 150];

export default function DashboardPreview() {
  const t = useTranslations("DashboardPreview");

  const stats = [
    [t("users"), "24.8K", "+12%"],
    [t("sales"), "1,284", "+8%"],
    [t("orders"), "684", "+15%"],
    [t("conversion"), "8.2%", "+2.1%"],
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-6 pb-28 pt-8 sm:px-8">
      <div className="pointer-events-none absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-[#c79a57]/10 blur-[130px]" />

      <Reveal>
        <div className="relative overflow-hidden rounded-[34px] border border-[#d9b06c]/15 bg-[#1d130a]/80 shadow-[0_30px_100px_rgba(0,0,0,.32)] backdrop-blur-2xl">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_48%_22%,rgba(201,154,82,.12),transparent_38%)]" />

          <div className="relative flex flex-col gap-5 border-b border-[#d9b06c]/10 px-7 py-7 sm:flex-row sm:items-end sm:justify-between sm:px-9">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#d9b06c]">
                {t("eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#f6efe1] sm:text-4xl">
                {t("title")}
              </h2>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9b06c]/15 bg-[#2b1b0d]/80 px-4 py-2 text-xs font-semibold text-[#d9b06c]">
              <span className="h-2 w-2 rounded-full bg-[#c79a57] shadow-[0_0_14px_rgba(199,154,87,.8)]" />
              {t("live")}
            </div>
          </div>

          <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="relative overflow-hidden rounded-[28px] border border-[#d9b06c]/12 bg-[#120c07] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-0 opacity-60 bg-[linear-gradient(rgba(217,176,108,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(217,176,108,.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#aa9b82]">{t("revenue")}</p>
                  <h3 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[#f6efe1]">$128,430</h3>
                </div>
                <div className="rounded-full border border-[#d9b06c]/15 bg-[#c79a57]/10 px-3 py-1.5 text-xs font-semibold text-[#d9b06c]">
                  +18.2%
                </div>
              </div>

              <div className="relative mt-8 flex h-64 items-end gap-2 sm:gap-3">
                {bars.map((value, i) => (
                  <div key={i} className="group relative flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-[10px] bg-gradient-to-t from-[#8a5d2b] via-[#c79a57] to-[#f0d08b] shadow-[0_0_20px_rgba(199,154,87,.08)] transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${value}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="relative mt-4 flex justify-between text-[10px] uppercase tracking-[0.18em] text-[#776a56]">
                <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {stats.map(([title, value, growth]) => (
                <div key={title} className="group rounded-[24px] border border-[#d9b06c]/12 bg-[#26190e]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9b06c]/30 hover:bg-[#2b1b0d]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#aa9b82]">{title}</p>
                    <span className="h-7 w-7 rounded-full border border-[#d9b06c]/10 bg-[#c79a57]/10" />
                  </div>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#f6efe1]">{value}</h3>
                  <p className="mt-2 text-xs font-semibold text-[#d9b06c]">{growth} <span className="ml-1 text-[#8e7d62]">vs last month</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
