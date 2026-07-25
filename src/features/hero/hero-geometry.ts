/**
 * Hero geometry — the single source of truth for the trail and its milestones.
 *
 * Every coordinate is in the intrinsic pixel space of the background plate. Nothing is
 * expressed in screen pixels.
 *
 * The rendered hero reproduces a box at exactly the plate's aspect ratio (see `hero.css`
 * → `.hero-stage`), so a coordinate here maps to the same point of the artwork at every
 * viewport size. The SVG consumes these numbers through its `viewBox`; the milestone
 * markers consume them as percentages of the same box. Because both read from this
 * module, the trail and its labels cannot drift apart.
 *
 * This geometry describes the landscape composition only. Portrait viewports do not crop
 * this artwork — they get their own hero built from type and motion, so there is no
 * second coordinate set to keep in step.
 */

export interface Plate {
  /** Intrinsic width of the background plate, in pixels. */
  readonly width: number;
  /** Intrinsic height of the background plate, in pixels. */
  readonly height: number;
  /** Trail path, in the plate's coordinate space. */
  readonly path: string;
  /** Stroke and node sizes, also in plate space. */
  readonly strokeWidth: number;
  readonly glowWidth: number;
  readonly glowBlur: number;
  readonly nodeRadius: number;
}

/**
 * The landscape plate.
 *
 * Dimensions are the cropped master produced by `scripts/prepare-hero-plates.mjs`. If the
 * artwork is replaced, these two numbers and the path below must be re-measured against
 * it — the script prints the resulting size.
 */
export const landscapePlate: Plate = {
  width: 2848,
  height: 1344,
  strokeWidth: 6,
  glowWidth: 17,
  glowBlur: 11,
  nodeRadius: 26,
  path: [
    // From the isolated mound, across open ground, then up the ridge terrace by terrace,
    // finishing beside the dashboard — the system the journey delivers.
    "M 240 735",
    "C 420 800, 600 900, 760 985",
    "C 850 1030, 950 985, 1035 925",
    "C 985 860, 925 800, 895 720",
    "C 875 660, 905 590, 985 545",
    "C 1020 525, 1055 515, 1080 512",
    "C 1110 470, 1130 420, 1165 355",
    "C 1195 300, 1225 255, 1245 222",
  ].join(" "),
};

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Milestone {
  readonly id: string;
  /**
   * How the marker is drawn.
   *
   * `pin` is the map-style teardrop that plants the first milestone on its own mound and
   * anchors the start of the trail; `node` is the compact pill used for the terraces the
   * trail climbs through on its way to the top.
   */
  readonly marker: "pin" | "node";
  /** Visible Hebrew label. */
  readonly label: string;
  /** Announced to assistive technology in place of the bare label. */
  readonly description: string;
  /** One line of supporting copy, used by the portrait hero. */
  readonly summary: string;
  /** In-page anchor this milestone navigates to. */
  readonly href: string;
  /** Position on the landscape plate. */
  readonly point: Point;
}

/**
 * The four delivery stages, ordered as a visitor reads them along the trail.
 *
 * Positions are traced onto the landforms in the artwork: the isolated mound, the terrace
 * with the village, the terrace with the observatory, and the high terrace beside the
 * dashboard. Each marker therefore stands on level ground rather than on a slope.
 */
export const milestones: readonly Milestone[] = [
  {
    id: "discovery",
    marker: "pin",
    label: "אפיון",
    description: "אפיון — שלב ראשון בתהליך",
    summary: "ממפים את זרימת העבודה כפי שהיא באמת",
    href: "#process-discovery",
    point: { x: 240, y: 735 },
  },
  {
    id: "planning",
    marker: "node",
    label: "תכנון",
    description: "תכנון — שלב שני בתהליך",
    summary: "מסמנים צווארי בקבוק ומתכננים את הפתרון",
    href: "#process-planning",
    point: { x: 1035, y: 925 },
  },
  {
    id: "build",
    marker: "node",
    label: "פיתוח",
    description: "פיתוח — שלב שלישי בתהליך",
    summary: "בונים בדיוק את מה שנדרש, בלי עודף",
    href: "#process-build",
    point: { x: 1080, y: 512 },
  },
  {
    id: "rollout",
    marker: "node",
    label: "הטמעה",
    description: "הטמעה — שלב רביעי בתהליך",
    summary: "מעלים לאוויר ומלווים עד שזה עובד",
    href: "#process-rollout",
    point: { x: 1245, y: 222 },
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

/** Milestone points the trail passes through, used to draw the target rings. */
export function trailNodes(): readonly Point[] {
  // The first milestone is marked by the pin that anchors the start of the trail, so it
  // does not also get a ring.
  return milestones.slice(1).map((milestone) => milestone.point);
}
