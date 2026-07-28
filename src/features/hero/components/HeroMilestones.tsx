"use client";
// Required: selecting a milestone opens an accessible modal dialog.

import type { CSSProperties } from "react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import {
  landscapePlate,
  milestones,
  toPercent,
  type Milestone,
} from "../hero-geometry";

/**
 * The tangle, in the portrait track's own coordinates: 16 units to the rem, so the box is
 * 12rem × 5.5rem. The amplitude falls monotonically on the way down — that decay is what
 * reads as "resolving" rather than "decorative squiggle" — and the last segment is
 * genuinely vertical so the eye is handed straight to the first stage.
 *
 * x = 168 is the tail, which is 1.5rem in from the inline-start edge and therefore the
 * centre of the 3rem node column beneath it.
 */
const RESOLVE_PATH = [
  "M 18 8",
  "C 78 -4, 122 20, 58 26",
  "C 6 31, 150 37, 146 46",
  "C 142 55, 66 54, 104 62",
  "C 132 68, 172 64, 158 72",
  "C 150 77, 162 78, 166 82",
  "L 168 88",
].join(" ");

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

export function HeroMilestones() {
  const [selected, setSelected] = useState<Milestone | null>(null);

  return (
    <>
      <div className="hero-milestone-map">
        {/*
         * Portrait only: the line that enters tangled and leaves straight.
         *
         * This is the whole sales argument with no words in it — a knotted process
         * resolving into one clear track — and the four stages below sit on the
         * straightened end of it as the evidence. It replaced a closed circle, which
         * read as "repeats forever, no beginning and no end": the opposite of the
         * promise, and precisely the fear a buyer brings to bespoke software.
         *
         * `dir` is irrelevant to it but the coordinates are not: the tail must land on
         * the first node's centre, so the box is exactly as wide as the node column and
         * the tail sits `NODE_CENTRE` in from the inline-start edge. Same reasoning as
         * the `dir="ltr"` on the art stage — a vector's coordinates are physical even
         * when the page is not.
         */}
        <svg
          className="hero-mobile-route"
          viewBox="0 0 192 88"
          fill="none"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="xMaxYMid meet"
        >
          <path
            className="hero-mobile-route-base"
            d={RESOLVE_PATH}
            fill="none"
            pathLength="1"
          />
          <path
            className="hero-mobile-route-progress"
            d={RESOLVE_PATH}
            fill="none"
            pathLength="1"
          />
        </svg>

        <ol className="hero-milestones">
          {milestones.map((milestone, index) => {
            const style = {
              "--hero-x": toPercent(milestone.point.x, landscapePlate.width),
              "--hero-y": toPercent(milestone.point.y, landscapePlate.height),
              "--hero-marker-delay": `${1.15 + index * 0.3}s`,
            } as CSSProperties;

            return (
              <li
                key={milestone.id}
                className={`hero-milestone hero-milestone--${milestone.marker}`}
                style={style}
              >
                <button
                  type="button"
                  className="hero-milestone-link"
                  aria-haspopup="dialog"
                  aria-label={`${milestone.description}. ${milestone.summary}. לפתיחת מידע נוסף`}
                  onClick={() => setSelected(milestone)}
                >
                  <span className="hero-milestone-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hero-milestone-label">{milestone.label}</span>
                  <span className="hero-milestone-summary">{milestone.summary}</span>
                </button>
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
      </div>

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.label ?? ""}
        description={selected?.summary}
        className="hero-milestone-dialog"
      >
        {selected && (
          <div className="hero-dialog-body">
            <div className="hero-dialog-status" aria-hidden="true">
              <span />
              PROCESS_STAGE_{selected.id.toUpperCase()}
            </div>
            <p>{selected.detail}</p>
            <ul>
              {selected.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <a href="#process" onClick={() => setSelected(null)}>
              לראות את התהליך המלא
            </a>
          </div>
        )}
      </Dialog>
    </>
  );
}
