import type { CSSProperties } from "react";
import { landscapePlate, milestones, toPercent } from "../hero-geometry";

/**
 * The map-style teardrop that plants the first milestone on its mound.
 *
 * Its tip is the anchor point, which is why that marker is translated by `-100%` in the
 * block direction rather than centred like the others.
 */
function PinMarker() {
  return (
    <svg
      className="hero-pin"
      viewBox="0 0 24 34"
      width="26"
      height="37"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 33.2C12 33.2 22.4 20.6 22.4 12.4A10.4 10.4 0 1 0 1.6 12.4C1.6 20.6 12 33.2 12 33.2Z"
        fill="var(--color-primary)"
      />
      <circle cx="12" cy="12" r="4" fill="var(--color-text-on-primary)" />
    </svg>
  );
}

/**
 * The four process milestones — written once, laid out two ways.
 *
 * On landscape the list becomes a layer the exact size of the plate and each item is
 * positioned as a percentage of it, so a marker sits on the same point of the artwork at
 * every viewport size. On portrait the same list is a vertical track beside a drawn line,
 * and each item shows its summary line.
 *
 * They are real anchors either way: readable text for search engines, reachable from the
 * keyboard, and they scroll to the process section. An ordered list because the four
 * stages are a sequence, and a screen reader should say so.
 */
export function HeroMilestones() {
  return (
    <ol className="hero-milestones">
      {milestones.map((milestone, index) => {
        const style = {
          "--hero-x": toPercent(milestone.point.x, landscapePlate.width),
          "--hero-y": toPercent(milestone.point.y, landscapePlate.height),
          // The markers arrive in trail order, just behind the line that draws them.
          "--hero-marker-delay": `${1.15 + index * 0.3}s`,
        } as CSSProperties;

        return (
          <li
            key={milestone.id}
            className={`hero-milestone hero-milestone--${milestone.marker}`}
            style={style}
          >
            {/*
              An explicit accessible name. Left to compute itself, the name is the label
              and the summary concatenated with no separator — "אפיוןממפים" — because the
              two spans have no whitespace between them in the markup. Stating it also
              carries the stage's position in the sequence, which the pill alone does not.
            */}
            <a
              href={milestone.href}
              className="hero-milestone-link"
              aria-label={`${milestone.description}. ${milestone.summary}`}
            >
              <span className="hero-milestone-label">{milestone.label}</span>
              <span className="hero-milestone-summary">{milestone.summary}</span>
            </a>
            {milestone.marker === "pin" && (
              <>
                <PinMarker />
                <span className="hero-pin-pulse" aria-hidden="true" />
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
