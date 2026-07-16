import { Link } from "@/i18n/navigation";

import Card from "@/components/ui/card";

export default function ProductReviews() {
  return (
    <section className="space-y-8">

      <div>
        <h2 className="text-4xl font-bold text-white">
          Customer Reviews
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          See what buyers think after using this template.
        </p>
      </div>

      <Card className="flex flex-col items-center gap-3 p-16 text-center">

        <p className="text-lg font-semibold text-white">
          No reviews yet
        </p>

        <p className="max-w-md text-slate-400">
          Nexora Core is an early-stage marketplace, so this template
          doesn&apos;t have reviews yet. Buy it and be the first to leave
          one — reach out on the{" "}
          <Link href="/contact" className="text-cyan-400 hover:underline">
            contact page
          </Link>{" "}
          after you&apos;ve tried it.
        </p>

      </Card>

    </section>
  );
}
