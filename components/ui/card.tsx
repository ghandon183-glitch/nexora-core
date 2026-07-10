import { HTMLAttributes } from "react";

type Glow = "cyan" | "violet" | "amber" | "pink";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: Glow;
}

const glowStyles: Record<Glow, string> = {
  cyan: "hover:border-cyan-400/30 hover:shadow-cyan-500/10",
  violet: "hover:border-violet-400/30 hover:shadow-violet-500/10",
  amber: "hover:border-amber-400/30 hover:shadow-amber-500/10",
  pink: "hover:border-pink-400/30 hover:shadow-pink-500/10",
};

export default function Card({
  children,
  className = "",
  glow = "cyan",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        shadow-2xl
        transition-all
        duration-300
        hover:-translate-y-2
        ${glowStyles[glow]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
