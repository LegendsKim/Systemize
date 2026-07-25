import type { CSSProperties } from "react";
import { desktopPlate, milestones, mobilePlate, toPercent } from "../hero-geometry";

/**
 * The four process milestones plotted along the trail.
 *
 * These are real anchors, not SVG text or image labels: they carry readable text for
 * search engines, they are reachable and operable from the keyboard, and they scroll to
 * the process section. Each is positioned as a percentage of the stage, and the stage
 * always has the background plate's exact aspect ratio, so a marker sits on the same
 * point of the artwork at every viewport size.
 *
 * Both coordinate sets are emitted as custom properties and the stylesheet picks one at
 * the breakpoint, so a single element serves both plates and there is no duplicated
 * markup for a crawler or a screen reader to encounter twice.
 */
export function HeroMilestones() {
  return (
    <>
      {milestones.map((milestone) => {
        const position = {
          "--hero-x-mobile": toPercent(milestone.mobile.x, mobilePlate.width),
          "--hero-y-mobile": toPercent(milestone.mobile.y, mobilePlate.height),
          "--hero-x-desktop": toPercent(milestone.desktop.x, desktopPlate.width),
          "--hero-y-desktop": toPercent(milestone.desktop.y, desktopPlate.height),
        } as CSSProperties;

        return (
          <a
            key={milestone.id}
            href={milestone.href}
            className="hero-milestone"
            style={position}
            aria-label={milestone.description}
          >
            {/* The artwork's coordinate space is left-to-right, but the label is Hebrew. */}
            <span dir="rtl">{milestone.label}</span>
          </a>
        );
      })}
    </>
  );
}
