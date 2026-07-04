export default function ComponentsShowcase() {
  const components = [
    {
      title: "Hero Sections",
      description: "Modern landing page hero blocks.",
      badge: "Popular",
      color: "from-cyan-500/20 via-blue-500/10 to-indigo-500/20",
    },
    {
      title: "Pricing Tables",
      description: "Beautiful pricing layouts.",
      badge: "New",
      color: "from-violet-500/20 via-fuchsia-500/10 to-pink-500/20",
    },
    {
      title: "Dashboards",
      description: "Professional admin interfaces.",
      badge: "Premium",
      color: "from-emerald-500/20 via-cyan-500/10 to-sky-500/20",
    },
    {
      title: "Authentication",
      description: "Login & Signup pages.",
      badge: "UI",
      color: "from-orange-500/20 via-red-500/10 to-pink-500/20",
    },
    {
      title: "Forms",
      description: "Modern input collections.",
      badge: "Forms",
      color: "from-blue-500/20 via-indigo-500/10 to-purple-500/20",
    },
    {
      title: "Testimonials",
      description: "Glassmorphism review cards.",
      badge: "Glass",
      color: "from-cyan-500/20 via-purple-500/10 to-fuchsia-500/20",
    },
  ];

  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <div className="text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            UI Components
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            250+ Premium Components
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Build beautiful websites faster using our collection of modern,
            production-ready UI components.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {components.map((item) => (
            <div
              key={item.title}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:border-cyan-400/30"
            >

              <div
                className={`relative h-56 bg-gradient-to-br ${item.color}`}
              >

                <span className="absolute right-5 top-5 rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
                  {item.badge}
                </span>

              </div>

              <div className="p-8">

                <h3 className="text-2xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-4 text-gray-400">
                  {item.description}
                </p>

                <button className="mt-8 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black transition hover:scale-105">
                  Explore Components
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}