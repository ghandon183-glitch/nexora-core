import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "gradient";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; variant?: Variant; }

export default function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#120b06] focus-visible:ring-[#d9b06c]";
  const variants = {
    primary: "bg-gradient-to-r from-[#c79a57] to-[#8a5d2b] text-[#160d03] shadow-lg shadow-[#8a5d2b]/20 hover:scale-105 hover:from-[#d9b06c] hover:to-[#b77f38]",
    gradient: "bg-gradient-to-r from-[#e0b76e] to-[#b77f38] text-[#160d03] shadow-lg shadow-[#c79a57]/25 hover:scale-105 hover:shadow-[#c79a57]/40",
    outline: "border border-[#d9b06c]/25 bg-transparent text-[#f6efe1] hover:bg-[#d9b06c]/10 hover:border-[#d9b06c]/55",
    ghost: "bg-[#d9b06c]/5 text-[#f6efe1] hover:bg-[#d9b06c]/10",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
}
