"use client";

export default function Sidebar() {
  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-40">

      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-2xl">

        {["🏠", "📊", "📈", "💰", "⚙️"].map((icon, index) => (
          <button
            key={index}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl transition hover:bg-cyan-500/20 hover:scale-110"
          >
            {icon}
          </button>
        ))}

      </div>

    </aside>
  );
}