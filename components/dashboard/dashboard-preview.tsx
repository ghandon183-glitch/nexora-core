import { useTranslations } from "next-intl";
import Reveal from "@/components/ui/reveal";

export default function DashboardPreview() {
  const t = useTranslations("DashboardPreview");
  return (
    <section className="relative mx-auto mt-10 max-w-7xl px-8 pb-24">

      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />

      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,229,255,.08)]">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">

            <div>
              <p className="text-sm text-slate-400">
                {t("eyebrow")}
              </p>

              <h2 className="mt-1 text-3xl font-bold text-white">
                {t("title")}
              </h2>
            </div>

            <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300">
              ● {t("live")}
            </div>

          </div>

          {/* Body */}
          <div className="grid gap-8 p-8 lg:grid-cols-3">

            {/* Chart */}
            <div className="lg:col-span-2">

              <div className="rounded-3xl border border-white/10 bg-[#0B1120] p-6">

                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-400">
                      {t("revenue")}
                    </p>

                    <h3 className="mt-2 text-4xl font-bold text-white">
                      $128,430
                    </h3>
                  </div>

                  <div className="rounded-xl bg-cyan-500/20 px-4 py-2 text-cyan-300">
                    +18.2%
                  </div>

                </div>

                <div className="flex h-72 items-end gap-3">

                  {[35,55,45,70,65,90,75,105,98,120,132,150].map((h,i)=>(
                    <div
                      key={i}
                      className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-500 to-violet-500 origin-bottom"
                      style={{height:`${h}%`}}
                    />
                  ))}

                </div>

              </div>

            </div>

            {/* Stats */}
            <div className="space-y-5">

              {[
                [t("users"),"24.8K","+12%"],
                [t("sales"),"1,284","+8%"],
                [t("orders"),"684","+15%"],
                [t("conversion"),"8.2%","+2.1%"],
              ].map(([title,value,growth])=>(
                <div
                  key={title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >

                  <p className="text-sm text-slate-400">
                    {title}
                  </p>

                  <h3 className="mt-3 text-3xl font-bold text-white">
                    {value}
                  </h3>

                  <p className="mt-2 text-sm text-emerald-400">
                    {growth}
                  </p>

                </div>
              ))}

            </div>

          </div>

        </div>
      </Reveal>

    </section>
  );
}
