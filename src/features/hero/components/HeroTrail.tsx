import { landscapePlate, trailNodes } from "../hero-geometry";

/**
 * The turquoise trail drawn over the hero plate.
 *
 * Purely decorative — every milestone it passes through is also rendered as a real link
 * in `HeroMilestones`, so hiding this from assistive technology loses nothing.
 *
 * A Server Component. The draw-in is a CSS animation rather than JavaScript, so the
 * server and client render identically and the hero costs nothing in client bundle.
 */
export function HeroTrail() {
  const plate = landscapePlate;
  const nodes = trailNodes();

  return (
    <svg
      className="hero-trail"
      viewBox={`0 0 ${plate.width} ${plate.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Object bounding box units, so the fade is measured along the path's own extent
            rather than the whole plate. The trail runs bottom-left to top-right, so this
            corner-to-corner vector brightens it as it climbs. */}
        <linearGradient id="hero-trail-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-trail)" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="var(--color-trail)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="1" />
        </linearGradient>
        {/* An SVG filter rather than a CSS blur: `stdDeviation` is in user units, so the
            glow scales with the artwork instead of staying a fixed count of screen px. */}
        <filter id="hero-trail-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={plate.glowBlur} />
        </filter>
      </defs>

      <path
        className="hero-trail-glow"
        d={plate.path}
        pathLength={1}
        strokeWidth={plate.glowWidth}
        filter="url(#hero-trail-blur)"
      />
      <path
        className="hero-trail-line"
        d={plate.path}
        pathLength={1}
        strokeWidth={plate.strokeWidth}
        stroke="url(#hero-trail-gradient)"
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
            r={plate.nodeRadius}
            strokeWidth={plate.nodeRadius * 0.125}
            opacity={0.4}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={plate.nodeRadius * 0.56}
            strokeWidth={plate.nodeRadius * 0.19}
          />
          <circle
            cx={node.x}
            cy={node.y}
            r={plate.nodeRadius * 0.19}
            strokeWidth={plate.nodeRadius * 0.19}
          />
        </g>
      ))}
    </svg>
  );
}
