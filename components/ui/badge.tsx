interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
}

export default function Badge({
  children,
  variant = "default",
}: BadgeProps) {
  const variants = {
    default:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",

    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",

    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}