import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "gradient";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e27] focus-visible:ring-white/60";

  const variants = {
    primary:
      "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 hover:scale-105 hover:shadow-fuchsia-500/40",

    gradient:
      "bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/25 hover:scale-105 hover:shadow-amber-500/40",

    outline:
      "border border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40",

    ghost:
      "bg-white/5 text-white hover:bg-white/10",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
