"use client";

import { useState } from "react";

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
}

export default function Tabs({ items }: TabsProps) {
  const [activeTab, setActiveTab] = useState(items[0]?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 border-b border-white/10">
        {items.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                active
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        {items.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}