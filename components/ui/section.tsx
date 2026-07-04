import { HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export default function Section({
  children,
  className = "",
  ...props
}: SectionProps) {
  return (
    <section
      className={`relative py-24 lg:py-32 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}