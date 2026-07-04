import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

interface PurchaseCardProps {
  price: number;
}

export default function PurchaseCard({
  price,
}: PurchaseCardProps) {
  return (
    <aside className="xl:sticky xl:top-32 xl:self-start">
      <Card className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">

        <div className="space-y-8">

          <div>

            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Premium License
            </p>

            <h2 className="mt-3 text-6xl font-black leading-none text-cyan-400">
              ${price}
            </h2>

            <div className="mt-6 space-y-3 text-base text-slate-300">

              <div>✓ One-time payment</div>

              <div>✓ Lifetime updates</div>

              <div>✓ Commercial license</div>

              <div>✓ Premium support</div>

            </div>

          </div>

          <div className="space-y-4">

            <Button className="w-full">
              Purchase Now
            </Button>

            <Button
              variant="outline"
              className="w-full"
            >
              Live Preview
            </Button>

          </div>

        </div>

      </Card>
    </aside>
  );
}