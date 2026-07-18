import { useTranslations } from "next-intl";
import Badge from "@/components/ui/badge";

interface ProductHeaderProps {
  title: string;
  description: string;
  badge?: string;
  price: number;
  headingFontClassName?: string;
}

export default function ProductHeader({
  title,
  description,
  badge,
  headingFontClassName = "",
}: ProductHeaderProps) {
  const t = useTranslations("ProductDetail");
  return (
    <div className="space-y-12">
      {badge && <Badge>{badge}</Badge>}

      <div className="space-y-6">
        <h1 className={`text-5xl font-black leading-tight tracking-tight text-white xl:text-6xl ${headingFontClassName}`}>
          {title}
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-slate-400">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          [t("framework"), "Next.js 15"],
          [t("styling"), "Tailwind CSS"],
          [t("license"), t("commercial")],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent px-6 py-4 backdrop-blur-xl"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {title}
            </p>

            <h3 className="mt-2 text-lg font-bold text-white">
              {value}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}