export default function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">

      {/* Glow */}
      <div className="absolute -inset-10 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Card */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,.45)]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-8 py-6">

          <div>
            <p className="text-sm text-gray-400">
              Dashboard Preview
            </p>

            <h3 className="mt-1 text-2xl font-bold text-white">
              Modern Analytics
            </h3>
          </div>

          <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300">
            ● Live
          </div>

        </div>

        {/* Chart */}
        <div className="px-8 pt-8">

          <div className="flex h-64 items-end justify-between gap-3 rounded-3xl bg-[#0B1225] p-6">

            {[25, 45, 35, 58, 52, 72, 64, 82, 77, 96].map((height) => (
              <div
                key={height}
                style={{ height: `${height}%` }}
                className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-500 via-sky-400 to-violet-500 transition-all duration-300 hover:scale-105"
              />
            ))}

          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-5 p-8">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <p className="text-sm text-gray-400">
              Revenue
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              $128K
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <p className="text-sm text-gray-400">
              Growth
            </p>

            <h2 className="mt-2 text-3xl font-bold text-emerald-400">
              +32%
            </h2>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <p className="text-sm text-gray-400">
              Users
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              24K
            </h2>

          </div>

        </div>

      </div>

    </div>
  );
}