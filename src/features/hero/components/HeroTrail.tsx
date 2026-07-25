import type { Plate, Point } from "../hero-geometry";

interface HeroTrailProps {
  /** Which background plate this trail belongs to. */
  readonly plate: Plate;
  /** Milestone points the line passes through, drawn as target rings. */
  readonly nodes: readonly Point[];
  /** Distinguishes the two trails' gradient and filter ids, which are document-global. */
  readonly variant: "desktop" | "mobile";
}

/**
 * The turquoise trail drawn over a hero plate.
 *
 * Purely decorative — every milestone it passes through is also rendered as a real link
 * in `HeroMilestones`, so hiding this from assistive technology loses nothing.
 *
 * This is a Server Component. The draw-in is a CSS animation rather than JavaScript, so
 * the server and client render identically and the hero costs nothing in client bundle.
 */
export function HeroTrail({ plate, nodes, variant }: HeroTrailProps) {
  const gradientId = `hero-trail-gradient-${variant}`;
  const blurId = `hero-trail-blur-${variant}`;
  const { nodeRadius } = plate;

  return (
    <svg
      className={`hero-trail hero-trail--${variant}`}
      viewBox={`0 0 ${plate.width} ${plate.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Object bounding box units, so the fade is measured along the path's own
            extent rather than the whole plate. Both trails run bottom-left to top-right,
            so the same corner-to-corner vector fades in at each one's true start. */}
        <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-trail)" stopOpacity="0" />
          <stop offset="0.22" stopColor="var(--color-trail)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="1" />
        </linearGradient>
        {/* An SVG filter rather than a CSS blur: `stdDeviation` is in user units, so the
            glow scales with the artwork instead of staying a fixed count of screen px. */}
        <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={plate.glowBlur} />
        </filter>
      </defs>

      <path
        className="hero-trail-glow"
        d={plate.path}
        pathLength={1}
        strokeWidth={plate.glowWidth}
        filter={`url(#${blurId})`}
      />
      <path
        className="hero-trail-line"
        d={plate.path}
        pathLength={1}
        strokeWidth={plate.strokeWidth}
        stroke={`url(#${gradientId})`}
      />

      {nodes.map((node, index) => (
        <g
          key={`${node.x}-${node.y}`}
          className="hero-node"
          style={{ animationDelay: `${1.2 + index * 0.32}s` }}
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            strokeWidth={nodeRadius * 0.125}
            opacity={0.4}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius * 0.56}
            strokeWidth={nodeRadius * 0.19}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius * 0.19}
            strokeWidth={nodeRadius * 0.19}
          />
        </g>
      ))}
    </svg>
  );
}
