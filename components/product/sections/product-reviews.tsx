import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import Card from "@/components/ui/card";

export default function ProductReviews() {
  const t = useTranslations("ProductDetail");
  return (
    <section className="space-y-8">

      <div>
        <h2 className="text-4xl font-bold text-white">
          {t("reviewsTitle")}
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          {t("reviewsSubtitle")}
        </p>
      </div>

      <Card className="flex flex-col items-center gap-3 p-16 text-center">

        <p className="text-lg font-semibold text-white">
          {t("noReviewsTitle")}
        </p>

        <p className="max-w-md text-slate-400">
          {t("noReviewsTextPart1")}{" "}
          <Link href="/contact" className="text-cyan-400 hover:underline">
            {t("noReviewsLinkText")}
          </Link>{" "}
          {t("noReviewsTextPart2")}
        </p>

      </Card>

    </section>
  );
}
