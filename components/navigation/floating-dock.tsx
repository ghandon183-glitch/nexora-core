"use client";

const items = [
  { icon: "🏠", label: "Home" },
  { icon: "📈", label: "Markets" },
  { icon: "🤖", label: "AI" },
  { icon: "📊", label: "Signals" },
  { icon: "⚙️", label: "Settings" },
];

export default function FloatingDock() {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex gap-3 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-3 shadow-2xl">
        {items.map((item) => (
          <button
            key={item.label}
            className="group flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 transition-all duration-300 hover:scale-110 hover:bg-cyan-500/20"
            title={item.label}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}