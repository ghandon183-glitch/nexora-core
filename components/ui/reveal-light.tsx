"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface RevealLightProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  duration?: number;
}

const EASE = "cubic-bezier(0.21, 0.47, 0.32, 0.98)";

// A/B experiment (scoped to Templates/Pricing/Testimonials/Trusted-by only):
// same visual contract as components/ui/reveal.tsx (fade + slide in once,
// on view, respecting reduced-motion) but without framer-motion, and with a
// single shared IntersectionObserver instead of one observer per instance.
let sharedObserver: IntersectionObserver | null = null;
const pending = new Map<Element, () => void>();

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        pending.get(entry.target)?.();
        sharedObserver?.unobserve(entry.target);
        pending.delete(entry.target);
      }
    },
    { rootMargin: "-80px", threshold: 0 }
  );

  return sharedObserver;
}

export default function RevealLight({
  children,
  className = "",
  delay = 0,
  y = 28,
  x = 0,
  duration = 0.6,
}: RevealLightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the current media query value on mount, not a synchronization loop
    setReducedMotion(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion !== false) return;

    const el = ref.current;
    if (!el) return;

    const observer = getSharedObserver();
    pending.set(el, () => setVisible(true));
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      pending.delete(el);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0)" : `translate(${x}px, ${y}px)`,
        transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
