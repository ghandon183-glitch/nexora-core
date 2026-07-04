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
      className={`relative pt-36 pb-24 lg:pb-32 ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}