interface HeadingProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export default function Heading({
  badge,
  title,
  description,
  align = "left",
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
        <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
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