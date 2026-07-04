export default function MarketOverview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-bold text-white">
        Market Overview
      </h2>

      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <span className="text-gray-400">BTC / USDT</span>
          <span className="font-bold text-green-400">$107,245</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">ETH / USDT</span>
          <span className="font-bold text-cyan-400">$2,481</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">SOL / USDT</span>
          <span className="font-bold text-purple-400">$152</span>
        </div>

      </div>
    </div>
  );
}