/**
 * Hero geometry — the single source of truth for the trail and its milestones.
 *
 * Everything here is expressed in the intrinsic pixel space of the background plates
 * (1672×941 landscape, 941×1672 portrait). Nothing is expressed in screen pixels.
 *
 * The rendered hero reproduces a CSS `cover` box at exactly the plate's aspect ratio
 * (see `hero.css` → `.hero-stage`), so a coordinate in this space maps to the same point
 * of the artwork at every viewport size. The SVG consumes these numbers through its
 * `viewBox`; the milestone markers consume them as percentages of the same box. Because
 * both read from this module, the trail and its labels cannot drift apart.
 */

export interface Plate {
  /** Intrinsic width of the background plate, in pixels. */
  readonly width: number;
  /** Intrinsic height of the background plate, in pixels. */
  readonly height: number;
  /** Trail path, in the plate's coordinate space. */
  readonly path: string;
  /**
   * Stroke and node sizes, in the plate's coordinate space.
   *
   * These differ per plate on purpose. The portrait plate is roughly half as wide as the
   * landscape one but is displayed on a narrower screen, so a stroke measured in plate
   * units renders thinner there. The portrait values are scaled up to compensate, which
   * keeps the trail visually the same weight on a phone and on a desktop.
   */
  readonly strokeWidth: number;
  readonly glowWidth: number;
  readonly glowBlur: number;
  readonly nodeRadius: number;
}

/** Landscape plate, used from the `md` breakpoint upward. */
export const desktopPlate: Plate = {
  width: 1672,
  height: 941,
  strokeWidth: 4,
  glowWidth: 11,
  glowBlur: 7,
  nodeRadius: 16,
  path: [
    "M 640 762",
    "C 700 752, 760 726, 792 672",
    "C 812 636, 820 600, 830 570",
    "C 862 558, 916 552, 962 542",
    "C 1002 533, 1032 516, 1040 480",
    "C 1047 444, 1020 416, 990 398",
    "C 968 385, 955 370, 952 350",
    "C 962 318, 988 288, 1014 258",
    "C 1040 228, 1068 205, 1092 190",
  ].join(" "),
};

/** Portrait plate, used below the `md` breakpoint. */
export const mobilePlate: Plate = {
  width: 941,
  height: 1672,
  strokeWidth: 7,
  glowWidth: 19,
  glowBlur: 12,
  nodeRadius: 27,
  path: [
    "M 300 1560",
    "C 370 1490, 470 1440, 530 1360",
    "C 570 1305, 580 1240, 565 1180",
    "C 550 1110, 500 1060, 460 1000",
    "C 420 940, 405 880, 425 815",
    "C 445 750, 500 715, 508 655",
    "C 518 585, 462 540, 472 470",
    "C 482 400, 548 350, 625 305",
  ].join(" "),
};

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Milestone {
  readonly id: string;
  /** Visible Hebrew label. */
  readonly label: string;
  /** Announced to assistive technology in place of the bare label. */
  readonly description: string;
  /** In-page anchor this milestone navigates to. */
  readonly href: string;
  /** Position on the landscape plate. */
  readonly desktop: Point;
  /** Position on the portrait plate. */
  readonly mobile: Point;
}

/**
 * The four delivery stages, ordered as a visitor reads them along the trail.
 *
 * Landscape positions are traced from the approved design reference. Portrait positions
 * are deliberately gathered into the lower part of the plate: on a phone the copy owns
 * the top of the screen, and markers up there would sit on top of the headline. The
 * trail still continues past the last marker toward the dashboard at the top of the
 * artwork, which reads as the destination.
 */
export const milestones: readonly Milestone[] = [
  {
    id: "discovery",
    label: "אפיון",
    description: "אפיון — שלב ראשון בתהליך",
    href: "#process",
    desktop: { x: 218, y: 715 },
    mobile: { x: 310, y: 1500 },
  },
  {
    id: "planning",
    label: "תכנון",
    description: "תכנון — שלב שני בתהליך",
    href: "#process",
    desktop: { x: 830, y: 570 },
    mobile: { x: 570, y: 1195 },
  },
  {
    id: "build",
    label: "פיתוח",
    description: "פיתוח — שלב שלישי בתהליך",
    href: "#process",
    desktop: { x: 952, y: 350 },
    mobile: { x: 432, y: 950 },
  },
  {
    id: "rollout",
    label: "הטמעה",
    description: "הטמעה — שלב רביעי בתהליך",
    href: "#process",
    desktop: { x: 1092, y: 190 },
    mobile: { x: 508, y: 800 },
  },
];

/**
 * Converts a plate coordinate to a percentage of the plate's box.
 *
 * Percentages, not pixels, are what let the markers track the artwork: the stage element
 * they are positioned inside always has the plate's exact aspect ratio.
 */
export function toPercent(value: number, extent: number): string {
  return `${((value / extent) * 100).toFixed(4)}%`;
}

/** Milestone nodes that the trail passes through, used to draw the target rings. */
export function trailNodes(plate: "desktop" | "mobile"): readonly Point[] {
  // The first milestone sits on its own mound beside the trail, matching the reference,
  // so it gets a marker but no ring on the line.
  return milestones.slice(1).map((milestone) => milestone[plate]);
}
