/**
 * Procedural topographic plate generator — prototype.
 *
 * Produces the layered "paper relief" contour scene as SVG. Deterministic: a fixed seed
 * gives byte-identical output on every run, so the artwork can live in version control
 * and be regenerated rather than stored as a binary master.
 */

// --- deterministic noise -------------------------------------------------

function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeValueNoise(seed) {
  const random = mulberry32(seed);
  const size = 256;
  const table = new Float64Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = random();

  const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (ix, iy) => table[(iy & (size - 1)) * size + (ix & (size - 1))];

  return function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

function makeFbm(seed, octaves = 5) {
  const noise = makeValueNoise(seed);
  return function fbm(x, y) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      value += amplitude * noise(x * frequency, y * frequency);
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / norm;
  };
}

// --- geometry helpers ----------------------------------------------------

/** Squared distance from a point to a segment, used to build the ridge spine. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2;
}

function distToPolyline(px, py, points) {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const d = distToSegment(px, py, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/**
 * Resamples a control polyline into a dense Catmull-Rom curve.
 *
 * Distance to a sparse polyline produces a ridge built from straight tubes with visible
 * creases where the segments meet — the "razor edge" look. Densifying first makes the
 * distance field smooth, so the ridge winds instead of folding.
 */
export function densifySpine(points, samplesPerSegment = 24) {
  const pts = [points[0], ...points, points[points.length - 1]];
  const out = [];

  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }

  out.push(points[points.length - 1]);
  return out;
}

const smoothstep = (edge0, edge1, x) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * A mesa profile: flat out to `inner`, then falling away to nothing at `outer`.
 *
 * This is what gives a milestone somewhere level to stand. A cone or a gaussian has no
 * flat top, so contour bands bunch tightly at its peak and a marker planted there sits on
 * a slope; a plateau produces one wide terrace instead.
 */
const plateau = (d, inner, outer) => 1 - smoothstep(inner, outer, d);

// --- height field --------------------------------------------------------

/**
 * Builds the elevation grid.
 *
 * The terrain is not pure noise: a ridge is raised along a chosen spine and a conical
 * mound is raised at a chosen point, so the landforms can be placed to suit the layout
 * rather than the layout having to accommodate whatever the noise produced.
 */
export function buildHeightField({ width, height, cols, rows, seed, spine, mound, anchors = [], ridgeWidth, noiseScale, margin = 0.09, pad = 0 }) {
  const fbm = makeFbm(seed);
  const curve = densifySpine(spine);
  const field = new Float64Array(cols * rows);

  /*
   * The field is computed over a domain larger than the plate. The border fade that keeps
   * every contour closed then happens outside the visible area, so its concentric rings
   * never appear as a rounded-rectangle frame around the artwork. The viewBox crops back
   * to the plate and the surplus geometry falls away.
   */
  const padX = width * pad;
  const padY = height * pad;
  const domainW = width + padX * 2;
  const domainH = height + padY * 2;

  let min = Infinity;
  let max = -Infinity;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i / (cols - 1)) * domainW - padX;
      const y = (j / (rows - 1)) * domainH - padY;
      const u = (x + padX) / domainW;
      const v = (y + padY) / domainH;

      // Base texture: gentle, large-scale undulation across the whole plate.
      let h = fbm(u * noiseScale, v * noiseScale) * 0.42;

      // Ridge: a smooth falloff from the spine, warped by noise at two scales so the
      // flanks are organic rather than a mathematically clean tube.
      const warp =
        (fbm(u * 4.5 + 11, v * 4.5 + 7) - 0.5) * ridgeWidth * 1.25 +
        (fbm(u * 11 + 31, v * 11 + 17) - 0.5) * ridgeWidth * 0.45;
      const d = distToPolyline(x, y, curve) + warp;
      // Smoothstep rather than a gaussian: it reaches its plateau gently, so the crest
      // does not clip into a flat slab with hard edges.
      h += (1 - smoothstep(0, ridgeWidth * 1.9, d)) * 0.62;

      // Mound: a separate landform for the first milestone, with a flat summit so the
      // terraces around it read as concentric steps rather than a smooth dome.
      const md = Math.hypot(x - mound.x, y - mound.y);
      h += plateau(md, mound.radius * 0.16, mound.radius) * mound.height;


      /*
       * Fade everything to zero near the border. This is what guarantees every contour
       * closes inside the plate: a contour that ran off the edge would be stitched shut
       * with a straight line across the artwork, which is the source of the comb-like
       * streaks an unbounded field produces. It also leaves the plate's border a single
       * flat colour, which the page background can then match exactly.
       */
      const edge =
        smoothstep(0, margin, u) *
        smoothstep(0, margin, 1 - u) *
        smoothstep(0, margin * (domainW / domainH), v) *
        smoothstep(0, margin * (domainW / domainH), 1 - v);
      h *= edge;

      field[j * cols + i] = h;
    }
  }

  /*
   * Anchor terraces, applied as a second pass over the finished ground.
   *
   * Each shelf is levelled a little above whatever the terrain already does at that
   * point, rather than at an absolute height chosen in advance. That is what keeps a
   * terrace sitting *on* the ridge: an absolute height turns into an isolated mesa
   * wherever the ground beneath happens to be lower, which reads as a floating disc.
   *
   * The radius is warped by noise so the shelves are weathered rather than drawn with a
   * compass — a perfect circle is the one shape this landscape never produces on its own.
   */
  const sample = (x, y) => {
    const i = Math.round(((x + padX) / domainW) * (cols - 1));
    const j = Math.round(((y + padY) / domainH) * (rows - 1));
    return field[Math.min(rows - 1, Math.max(0, j)) * cols + Math.min(cols - 1, Math.max(0, i))];
  };

  for (const anchor of anchors) {
    const level = sample(anchor.x, anchor.y) + (anchor.lift ?? 0.06);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = (i / (cols - 1)) * domainW - padX;
        const y = (j / (rows - 1)) * domainH - padY;
        const raw = Math.hypot(x - anchor.x, y - anchor.y);
        if (raw > anchor.radius * 1.6) continue;

        const warp =
          (fbm((x / domainW) * 9 + anchor.x, (y / domainH) * 9 + anchor.y) - 0.5) *
          anchor.radius *
          0.55;
        const shelf = plateau(raw + warp, anchor.radius * 0.5, anchor.radius);
        if (shelf <= 0) continue;

        const index = j * cols + i;
        field[index] = Math.max(field[index], field[index] * (1 - shelf) + level * shelf);
      }
    }
  }

  for (const value of field) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  // Normalise, so the caller's level thresholds mean the same thing whatever the terrain
  // parameters were. Without this the crest clips whenever the components sum past 1.
  const range = max - min || 1;
  for (let i = 0; i < field.length; i++) field[i] = (field[i] - min) / range;

  return field;
}

// --- marching squares ----------------------------------------------------

const EDGE_TABLE = {
  1: [[3, 2]],
  2: [[2, 1]],
  3: [[3, 1]],
  4: [[1, 0]],
  5: [[3, 0], [1, 2]],
  6: [[2, 0]],
  7: [[3, 0]],
  8: [[0, 3]],
  9: [[0, 2]],
  10: [[0, 1], [2, 3]],
  11: [[0, 1]],
  12: [[1, 3]],
  13: [[1, 2]],
  14: [[2, 3]],
};

/**
 * Extracts closed iso-contours at `level` from the grid.
 *
 * The grid spans the padded domain, so `originX`/`originY` shift the output back into
 * plate coordinates.
 */
export function contour(field, cols, rows, width, height, level, originX = 0, originY = 0) {
  const segments = [];
  const sx = width / (cols - 1);
  const sy = height / (rows - 1);

  const interp = (x1, y1, v1, x2, y2, v2) => {
    const t = (level - v1) / (v2 - v1 || 1e-9);
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  };

  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const v = [
        field[j * cols + i],
        field[j * cols + i + 1],
        field[(j + 1) * cols + i + 1],
        field[(j + 1) * cols + i],
      ];
      let code = 0;
      for (let k = 0; k < 4; k++) if (v[k] > level) code |= 1 << (3 - k);
      if (code === 0 || code === 15) continue;

      const x0 = i * sx + originX;
      const y0 = j * sy + originY;
      const corners = [
        [x0, y0],
        [x0 + sx, y0],
        [x0 + sx, y0 + sy],
        [x0, y0 + sy],
      ];
      // Edge n runs from corner n to corner (n+1)%4.
      const edgePoint = (n) => {
        const a = n;
        const b = (n + 1) % 4;
        return interp(corners[a][0], corners[a][1], v[a], corners[b][0], corners[b][1], v[b]);
      };

      for (const [from, to] of EDGE_TABLE[code] ?? []) {
        segments.push([edgePoint(from), edgePoint(to)]);
      }
    }
  }

  return stitch(segments);
}

/** Joins loose segments into polylines, closing loops where the ends meet. */
function stitch(segments) {
  const key = (p) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  const starts = new Map();
  for (const seg of segments) {
    const k = key(seg[0]);
    if (!starts.has(k)) starts.set(k, []);
    starts.get(k).push(seg);
  }

  const used = new Set();
  const paths = [];

  for (const seg of segments) {
    if (used.has(seg)) continue;
    used.add(seg);
    const points = [seg[0], seg[1]];

    for (;;) {
      const next = (starts.get(key(points[points.length - 1])) ?? []).find((s) => !used.has(s));
      if (!next) break;
      used.add(next);
      points.push(next[1]);
      if (key(points[0]) === key(points[points.length - 1])) break;
    }

    if (points.length > 4) paths.push(points);
  }

  return paths;
}

/** Chaikin corner cutting: removes the stair-stepping the grid leaves behind. */
export function smooth(points, iterations = 3) {
  let result = points;
  const closed = points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1];

  for (let n = 0; n < iterations; n++) {
    const next = [];
    const last = closed ? result.length - 1 : result.length - 1;
    if (!closed) next.push(result[0]);
    for (let i = 0; i < last; i++) {
      const [ax, ay] = result[i];
      const [bx, by] = result[i + 1];
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
      next.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    if (closed) next.push(next[0]);
    else next.push(result[result.length - 1]);
    result = next;
  }

  return result;
}

/**
 * Ramer-Douglas-Peucker simplification.
 *
 * Contour extraction emits a vertex per grid-cell crossing and smoothing multiplies that
 * several times over, so a field of gentle curves arrives carrying far more points than
 * its shape needs. Dropping the ones that sit within `tolerance` of the line between
 * their neighbours is invisible at display size, and is the difference between a
 * background that weighs a megabyte and one that weighs a few tens of kilobytes.
 */
export function simplify(points, tolerance = 2) {
  if (points.length < 3) return points;

  const toleranceSq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    let furthest = -1;
    let furthestDistSq = 0;

    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
      t = Math.max(0, Math.min(1, t));
      const distSq = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      if (distSq > furthestDistSq) {
        furthestDistSq = distSq;
        furthest = i;
      }
    }

    if (furthest !== -1 && furthestDistSq > toleranceSq) {
      keep[furthest] = 1;
      stack.push([first, furthest], [furthest, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

export function toPathData(points, precision = 1) {
  return (
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(precision)} ${p[1].toFixed(precision)}`)
      .join("") + "Z"
  );
}
