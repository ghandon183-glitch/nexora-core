const VARIANTS = {
  violet: [
    "left-[-10%] top-[-10%] h-[420px] w-[420px] bg-violet-500/20",
    "right-[-8%] top-[20%] h-[380px] w-[380px] bg-fuchsia-500/10",
  ],
  cyan: [
    "left-[-8%] top-[-10%] h-[420px] w-[420px] bg-cyan-500/20",
    "right-[-10%] top-[15%] h-[380px] w-[380px] bg-violet-500/10",
  ],
  amber: [
    "left-[-8%] top-[-10%] h-[420px] w-[420px] bg-amber-400/15",
    "right-[-10%] top-[15%] h-[380px] w-[380px] bg-orange-500/10",
  ],
  emerald: [
    "left-[-8%] top-[-10%] h-[420px] w-[420px] bg-emerald-500/15",
    "right-[-10%] top-[15%] h-[380px] w-[380px] bg-cyan-500/10",
  ],
  fuchsia: [
    "left-[-8%] top-[-10%] h-[420px] w-[420px] bg-fuchsia-500/15",
    "right-[-10%] top-[15%] h-[380px] w-[380px] bg-violet-500/10",
  ],
} as const;

export type PageGlowVariant = keyof typeof VARIANTS;

interface PageGlowProps {
  variant?: PageGlowVariant;
}

/**
 * Soft blurred accent orbs used behind page headers, echoing the homepage
 * hero's multi-color gradient treatment. Each page picks a variant so the
 * site feels part of one family without every page looking identical.
 */
export default function PageGlow({ variant = "cyan" }: PageGlowProps) {
  const blobs = VARIANTS[variant];

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {blobs.map((cls, i) => (
        <div key={i} className={`absolute rounded-full blur-[120px] ${cls}`} />
      ))}
    </div>
  );
}
