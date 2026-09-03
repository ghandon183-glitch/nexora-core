interface BadgeProps { children: React.ReactNode; variant?: "default" | "success" | "warning"; }

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "border-[#d9b06c]/30 bg-[#d9b06c]/10 text-[#e0b76e]",
    success: "border-[#b9a06e]/30 bg-[#b9a06e]/10 text-[#d9c08a]",
    warning: "border-[#c79a57]/35 bg-[#c79a57]/10 text-[#e0b76e]",
  };
  return <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium ${variants[variant]}`}>{children}</span>;
}
