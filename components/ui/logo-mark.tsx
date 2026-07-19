interface LogoMarkProps {
  className?: string;
}

/**
 * Nexora Core's logo mark: an abstract "N" built from two straight bars and
 * one diagonal stroke, with a small ringed node accent nodding to the
 * "nexus" in the name. Designed to sit inside the existing gradient badge
 * container, so it's a plain white icon (the violet-to-cyan gradient comes
 * from the badge background behind it, as with the old "N" letter).
 */
export default function LogoMark({ className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="108" y="96" width="72" height="320" rx="16" fill="currentColor" />
      <rect x="332" y="96" width="72" height="320" rx="16" fill="currentColor" />
      <rect
        x="210"
        y="86"
        width="92"
        height="340"
        rx="16"
        fill="currentColor"
        transform="rotate(-35 256 256)"
      />
      <circle
        cx="400"
        cy="92"
        r="28"
        fill="currentColor"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="10"
      />
    </svg>
  );
}
