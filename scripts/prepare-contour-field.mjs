/**
 * Generates the faint topographic field that sits behind the hero.
 *
 * Run with `node scripts/prepare-contour-field.mjs`. Output is committed, so the site
 * build never depends on this script.
 *
 * Why it exists
 * -------------
 * The plate stops short of the viewport edge, and matching the page background to its
 * border colour is not enough to hide where it ends. The mismatch the eye actually finds
 * is *texture*, not colour: inside the plate the whole surface carries faint contour
 * lines, and outside it the page is perfectly flat. A boundary between textured and
 * untextured reads as an edge no matter how well the two tones agree.
 *
 * So the texture continues into the page. This field is drawn in the same visual language
 * as the artwork — a topographic survey, matching the wordmark and the coordinates — and
 * once it runs underneath and past the plate, there is no boundary left to see.
 *
 * The portrait hero uses the same file as its background, where it carries the brand's
 * look without downloading any artwork at all.
 *
 * Deterministic: a fixed seed gives byte-identical output on every run.
 */
import { writeFileSync } from "node:fs";
import { buildHeightField, contour, simplify, smooth, toPathData } from "./lib/terrain.mjs";

const WIDTH = 2400;
const HEIGHT = 1350;
const COLS = 210;
const ROWS = 120;
const PAD = 0.14;
const LINES = 26;

/*
 * No ridge and no mound: this is open ground only. Any landform here would compete with
 * the artwork it sits behind, and on portrait it would compete with the headline.
 */
const field = buildHeightField({
  width: WIDTH,
  height: HEIGHT,
  cols: COLS,
  rows: ROWS,
  seed: 91177,
  spine: [
    [-500, -500],
    [-480, -480],
  ],
  mound: { x: -1000, y: -1000, radius: 1, height: 0 },
  ridgeWidth: 1,
  noiseScale: 3.6,
  margin: 0.12,
  pad: PAD,
});

const domainW = WIDTH * (1 + PAD * 2);
const domainH = HEIGHT * (1 + PAD * 2);

const paths = [];
for (let i = 0; i < LINES; i++) {
  const level = 0.1 + (0.82 * i) / (LINES - 1);
  for (const ring of contour(field, COLS, ROWS, domainW, domainH, level, -WIDTH * PAD, -HEIGHT * PAD)) {
    /*
     * Smooth first to remove the grid's stair-stepping, then simplify to throw away the
     * points that step created. Precision 0 is under half a pixel at this scale.
     */
    paths.push(toPathData(simplify(smooth(ring, 2), 2.4), 0));
  }
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
  `preserveAspectRatio="xMidYMid slice">` +
  `<g fill="none" stroke="#c9cace" stroke-width="1.1" opacity="0.34">` +
  paths.map((d) => `<path d="${d}"/>`).join("") +
  `</g></svg>`;

writeFileSync("public/hero/contour-field.svg", svg);
console.log(
  `public/hero/contour-field.svg  ${WIDTH}x${HEIGHT}  ${paths.length} lines  ${(svg.length / 1024).toFixed(0)}KB`
);
