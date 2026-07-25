interface SystemizeMarkProps {
  readonly className?: string;
}

/**
 * The Systemize mark: a surveyor's target.
 *
 * Drawn as inline SVG rather than shipped as an image file so it inherits `currentColor`,
 * stays crisp at any size, and costs no extra request. Decorative — the accessible name
 * comes from the link that wraps it.
 */
export function SystemizeMark({ className }: SystemizeMarkProps) {
  return (
    <svg
      className={className}
      viewBox="-16 -16 32 32"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Cross arms, broken where they meet the ring so the centre stays readable. */}
      <path d="M-15 0 H-10.5 M10.5 0 H15 M0 -15 V-10.5 M0 10.5 V15" />
      <circle r="8.6" />
      <circle r="3.4" />
      <circle r="0.9" fill="currentColor" stroke="none" />
      {/* Diagonal registration ticks. */}
      <path
        d="M-11.4 -11.4 l2.4 2.4 M11.4 -11.4 l-2.4 2.4 M-11.4 11.4 l2.4 -2.4 M11.4 11.4 l-2.4 -2.4"
        opacity="0.55"
      />
    </svg>
  );
}
