const ACCENTS = {
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  fuchsia: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
} as const;

interface HeadingProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  accent?: keyof typeof ACCENTS;
}

export default function Heading({
  badge,
  title,
  description,
  align = "left",
  accent = "cyan",
}: HeadingProps) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-3xl text-center"
          : ""
      }
    >
      {badge && (
        <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${ACCENTS[accent]}`}>
          {badge}
        </span>
      )}

      <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-6 text-lg leading-8 text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}