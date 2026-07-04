export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for freelancers and personal projects.",
      features: [
        "20 Premium Templates",
        "100+ Components",
        "Lifetime Updates",
        "Email Support",
      ],
      button: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$79",
      description: "Best choice for startups and growing businesses.",
      features: [
        "150 Premium Templates",
        "250+ Components",
        "Figma Files",
        "Lifetime Updates",
        "Priority Support",
      ],
      button: "Buy Pro",
      popular: true,
    },
    {
      name: "Agency",
      price: "$199",
      description: "Unlimited access for agencies and large teams.",
      features: [
        "Unlimited Templates",
        "All Components",
        "Commercial License",
        "Lifetime Updates",
        "VIP Support",
      ],
      button: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <section className="bg-[#060B18] py-32">
      <div className="mx-auto max-w-7xl px-8">

        <div className="text-center">

          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            Pricing
          </span>

          <h2 className="mt-6 text-5xl font-black text-white">
            Simple Pricing
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Choose the plan that fits your workflow.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >

              {plan.popular && (
                <div className="mb-6 inline-block rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black">
                  Most Popular
                </div>
              )}

              <h3 className="text-3xl font-bold text-white">
                {plan.name}
              </h3>

              <div className="mt-6 text-5xl font-black text-white">
                {plan.price}
              </div>

              <p className="mt-4 text-gray-400">
                {plan.description}
              </p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <span className="text-cyan-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-10 w-full rounded-xl py-4 font-bold transition ${
                  plan.popular
                    ? "bg-cyan-500 text-black hover:scale-105"
                    : "border border-white/20 text-white hover:bg-white/10"
                }`}
              >
                {plan.button}
              </button>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}