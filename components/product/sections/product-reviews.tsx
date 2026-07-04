import Card from "@/components/ui/card";

export default function ProductReviews() {
  return (
    <section className="space-y-8">

      <div>
        <h2 className="text-4xl font-bold text-white">
          Customer Reviews
        </h2>

        <p className="mt-3 text-lg text-slate-400">
          Developers and agencies using this template.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <Card className="p-8">
          <div className="mb-4 flex text-xl text-cyan-400">
            ★★★★★
          </div>

          <p className="leading-8 text-slate-300">
            One of the cleanest templates I've purchased.
            The codebase is extremely organized and easy to customize.
          </p>

          <div className="mt-8">
            <h4 className="font-semibold text-white">
              Michael Ross
            </h4>

            <p className="text-sm text-slate-500">
              Frontend Developer
            </p>
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-4 flex text-xl text-cyan-400">
            ★★★★★
          </div>

          <p className="leading-8 text-slate-300">
            Beautiful animations, modern design and excellent
            performance. Highly recommended.
          </p>

          <div className="mt-8">
            <h4 className="font-semibold text-white">
              Sarah Johnson
            </h4>

            <p className="text-sm text-slate-500">
              UI Designer
            </p>
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-4 flex text-xl text-cyan-400">
            ★★★★★
          </div>

          <p className="leading-8 text-slate-300">
            Saved us weeks of development time.
            Everything feels premium.
          </p>

          <div className="mt-8">
            <h4 className="font-semibold text-white">
              Daniel Cooper
            </h4>

            <p className="text-sm text-slate-500">
              Startup Founder
            </p>
          </div>
        </Card>

      </div>

    </section>
  );
}