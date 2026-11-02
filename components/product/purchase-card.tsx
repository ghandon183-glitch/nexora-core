import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

interface PurchaseCardProps {
  slug: string;
  price: number;
  demoUrl: string;
}

export default function PurchaseCard({
  slug,
  price,
  demoUrl,
}: PurchaseCardProps) {
  const t = useTranslations("ProductDetail");
  const previewUrl = demoUrl;
  const hasDemo = previewUrl && previewUrl !== "#";

  return (
    <aside className="xl:sticky xl:top-40 xl:self-start">
      <Card className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl">
        <div className="space-y-7">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              {t("premiumLicense")}
            </p>

            <h2 className="mt-3 text-6xl font-black leading-none text-cyan-400">
              ${price}
            </h2>
            <p className="mt-2 text-sm text-slate-400">One-time payment · no subscription</p>

            <div className="mt-6 space-y-3 text-base text-slate-300">
              <div>✓ {t("onePayment")}</div>
              <div>✓ {t("lifetimeUpdates")}</div>
              <div>✓ {t("commercialLicense")}</div>
              <div>✓ {t("premiumSupport")}</div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href={`/checkout/${slug}`}
              data-analytics-event="begin_checkout"
              data-analytics-template={slug}
              className="block"
            >
              <Button className="w-full">{t("purchaseNow")}</Button>
            </Link>

            {hasDemo ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics-event="live_demo_click"
                data-analytics-template={slug}
                className="block"
              >
                <Button variant="outline" className="w-full">
                  {t("livePreview")}
                </Button>
              </a>
            ) : (
              <Button
                variant="outline"
                className="w-full cursor-not-allowed opacity-50"
                disabled
                title="Live preview coming soon"
              >
                {t("livePreviewComingSoon")}
              </Button>
            )}
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Commercial license — at a glance</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use the source in one finished personal, commercial, or client project. You may modify it,
                but you may not resell or redistribute the template source itself. Separate end products need
                separate licenses.
              </p>
              <Link href="/license" className="mt-2 inline-flex text-sm font-medium text-cyan-300 hover:underline">
                Read the full license
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Refunds — before you buy</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Because this is digital source code, change-of-mind refunds are generally unavailable after
                secure delivery. We will review materially defective or misdescribed packages and duplicate
                charges. Rights that cannot lawfully be excluded remain unaffected.
              </p>
              <Link href="/refunds" className="mt-2 inline-flex text-sm font-medium text-cyan-300 hover:underline">
                Read the refund policy
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </aside>
  );
}
