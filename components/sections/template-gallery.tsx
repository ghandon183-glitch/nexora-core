import Card from "@/components/ui/card";

const previews = [
  "Desktop Preview",
  "Dashboard",
  "Tablet View",
  "Mobile View",
];

export default function TemplateGallery() {
  return (
    <section className="mt-24">

      <div className="mb-10">

        <h2 className="text-3xl font-bold text-white">
          Template Gallery
        </h2>

        <p className="mt-3 text-slate-400">
          Explore different sections of this premium template.
        </p>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {previews.map((item) => (

          <Card
            key={item}
            className="overflow-hidden p-0"
          >

            <div className="aspect-[16/10] bg-gradient-to-br from-cyan-500/20 via-slate-900 to-violet-500/20 transition duration-500 hover:scale-[1.02]" />

            <div className="border-t border-white/10 p-5">

              <h3 className="text-lg font-semibold text-white">
                {item}
              </h3>

            </div>

          </Card>

        ))}

      </div>

    </section>
  );
}