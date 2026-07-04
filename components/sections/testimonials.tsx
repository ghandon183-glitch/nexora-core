export default function Testimonials() {
  const testimonials = [
    {
      name: "Alex Johnson",
      role: "Founder @ PixelCraft",
      text: "Nexora saved us weeks of UI development. The quality is incredible.",
    },
    {
      name: "Sarah Williams",
      role: "Product Designer",
      text: "Beautiful components with clean code. Everything feels premium.",
    },
    {
      name: "David Kim",
      role: "Startup CEO",
      text: "Our landing page was ready in one afternoon instead of two weeks.",
    },
  ];

  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <div className="text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            Testimonials
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            Loved by Developers
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Thousands of creators build faster using Nexora.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition hover:-translate-y-2"
            >
              <div className="mb-6 flex gap-1 text-cyan-400">
                ★★★★★
              </div>

              <p className="leading-8 text-gray-300">
                &quot;{item.text}&quot;
              </p>

              <div className="mt-8">

                <h3 className="font-bold text-white">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-400">
                  {item.role}
                </p>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}