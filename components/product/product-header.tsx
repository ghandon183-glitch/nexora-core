import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

interface ProductHeaderProps {
  title: string;
  description: string;
  badge?: string;
  price: number;
}

export default function ProductHeader({
  title,
  description,
  badge,
  price,
}: ProductHeaderProps) {
  return (
    <div className="space-y-12">
      {badge && <Badge>{badge}</Badge>}

      <div className="space-y-6">
        <h1 className="text-5xl font-black leading-tight tracking-tight text-white xl:text-6xl">
          {title}
        </h1>

        <p className="max-w-3xl text-lg leading-8 text-slate-400">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {[
          ["Framework", "Next.js 15"],
          ["Styling", "Tailwind CSS"],
          ["License", "Commercial"],
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

      <Card className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-0">
        <div className="flex flex-col gap-10 p-10 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
              Premium License
            </p>

            <h2 className="mt-4 text-6xl font-black text-white">
              ${price}
            </h2>

            <p className="mt-4 max-w-lg text-slate-400">
              One-time purchase with lifetime updates, commercial license,
              premium support and access to future improvements.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button className="min-w-[190px]">
              Live Preview
            </Button>

            <Button
              variant="outline"
              className="min-w-[190px]"
            >
              Purchase Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}