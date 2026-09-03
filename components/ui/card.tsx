import { HTMLAttributes } from "react";

type Glow = "cyan" | "violet" | "amber" | "pink";
interface CardProps extends HTMLAttributes<HTMLDivElement> { children: React.ReactNode; glow?: Glow; }

const glowStyles: Record<Glow, string> = {
  cyan: "hover:border-[#d9b06c]/35 hover:shadow-[#8a5d2b]/15",
  violet: "hover:border-[#d9b06c]/35 hover:shadow-[#8a5d2b]/15",
  amber: "hover:border-[#e0b76e]/45 hover:shadow-[#c79a57]/15",
  pink: "hover:border-[#d9b06c]/35 hover:shadow-[#8a5d2b]/15",
};

export default function Card({ children, className = "", glow = "cyan", ...props }: CardProps) {
  return (
    <div className={`rounded-3xl border border-[#d9b06c]/12 bg-[#26190e]/65 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:-translate-y-2 ${glowStyles[glow]} ${className}`} {...props}>
      {children}
    </div>
  );
}
