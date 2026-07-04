import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({
  children,
  className = "",
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
        hover:border-cyan-400/30
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}