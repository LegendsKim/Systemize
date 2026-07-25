/**
 * Regenerates the hero background plate served from `public/hero/`.
 *
 * Run with `node scripts/prepare-hero-plates.mjs` after replacing the master render in
 * `docs/design/`. The master is the original artwork and is never served directly.
 *
 * Three things happen here, each for a reason worth keeping:
 *
 * 1. CROP. The master carries the image generator's sparkle watermark in its
 *    bottom-right corner. That strip is empty field — the terrain ends well to the left
 *    of it — so removing it costs nothing.
 *
 * 2. REDACT. The generated dashboard has a fabricated product name across its header.
 *    Every other label in that UI is already illegible, so blurring this one line makes
 *    it consistent rather than conspicuous, and keeps another brand's name off the front
 *    page of this one.
 *
 * 3. UPSCALE. The master is 2848px wide after cropping. Next.js generates image variants
 *    up to 3840px, so without this step the optimizer would stretch the master on a 4K
 *    display — the exact softness this pipeline exists to prevent. Resampling once here,
 *    with Lanczos and a light sharpen, gives it real pixels to downscale from at every
 *    breakpoint.
 *
 * Output is quality-95 WebP rather than PNG. At this content the difference is invisible,
 * the optimizer re-encodes to AVIF anyway, and it keeps a very large lossless
 * intermediate out of the repository.
 *
 * If the master is replaced, re-check what depends on its pixel dimensions:
 *   - `landscapePlate` in `src/features/hero/hero-geometry.ts`
 *   - `--color-hero-field` in `src/app/globals.css`, which must keep matching the plate's
 *     border exactly or a seam appears where the artwork ends
 *   - the crop and redaction rectangles below, which are measured against this master
 */
import sharp from "sharp";

const MASTER = "docs/design/hero-plate-landscape.png";
const OUTPUT = "public/hero/hero-landscape.webp";

/** Watermark strip on the right edge of the master, in master pixels. */
const CROP_RIGHT = 320;

/** The fabricated product name in the dashboard header, in cropped-plate pixels. */
const REDACT = { left: 1496, top: 352, width: 212, height: 44 };

/** Target width. Matches the largest variant Next.js will ask for. */
const TARGET_WIDTH = 3840;

const { width, height } = await sharp(MASTER).metadata();
const cropped = width - CROP_RIGHT;

/*
 * Each stage is materialised as a buffer rather than chained.
 *
 * sharp applies a pipeline's operations in its own fixed order, not the order they are
 * written: `composite` runs after `resize`, and a second `extract` resolves against the
 * original image rather than the first extract's result. Chaining crop → redact → upscale
 * in one pipeline therefore places the patch in the wrong coordinate space and silently
 * ships an un-redacted plate. Separate pipelines make each stage mean what it says.
 */

// 1. Crop the watermark strip.
const croppedPlate = await sharp(MASTER)
  .extract({ left: 0, top: 0, width: cropped, height })
  .png()
  .toBuffer();

// 2. Redact the fabricated product name, in cropped-plate coordinates.
const redacted = await sharp(croppedPlate)
  .composite([{ input: await featheredBlur(croppedPlate, REDACT), left: REDACT.left, top: REDACT.top }])
  .png()
  .toBuffer();

/*
 * 3. Upscale to the largest variant Next.js will request.
 *
 * Deliberately no sharpening pass. A sharpen leaves a bright halo along every strong
 * edge, and the outermost pixels of the image are the strongest edge there is — it lifted
 * the border about six levels above the field behind it and drew a visible rectangle
 * around the artwork on the page. This is only a 1.35x upscale, so the detail a sharpen
 * would recover is not worth an artefact at the one place that has to be invisible.
 */
await sharp(redacted)
  .resize({ width: TARGET_WIDTH, kernel: "lanczos3" })
  .webp({ quality: 95, effort: 6 })
  .toFile(OUTPUT);

const out = await sharp(OUTPUT).metadata();
console.log(
  `${MASTER}\n  ${width}x${height} -> crop ${cropped}x${height} -> ${out.width}x${out.height}\n` +
    `  aspect ${(out.width / out.height).toFixed(4)}   edge #${await edgeColour(OUTPUT)}`
);
console.log(
  "\nThe edge colour must match --color-hero-field in src/app/globals.css.\n" +
    "If it drifts, a visible seam appears where the plate stops short of the viewport."
);

/**
 * Returns a blurred copy of `region` whose edges fade to transparent.
 *
 * A hard-edged blur reads as a censorship box — the eye finds the rectangle even though
 * it cannot read what was under it. Feathering the alpha lets the blur dissolve into the
 * surrounding panel, so the header simply looks out of focus like every other label in
 * this generated dashboard.
 */
async function featheredBlur(image, region) {
  const { width, height } = region;
  const inset = 6;

  const mask = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}">` +
            `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="10" fill="#fff"/>` +
            `</svg>`
        ),
      },
    ])
    .blur(5)
    .png()
    .toBuffer();

  const blurred = await sharp(image).extract(region).blur(9).png().toBuffer();

  return sharp(blurred).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

/**
 * The colour of the plate's border field.
 *
 * Two details matter here, and both were learned the hard way.
 *
 * A *median* rather than a mean: the contour lines that run off the edge of the artwork
 * are much darker than the field around them, and averaging them in produces a background
 * noticeably darker than the pixels actually meeting the boundary.
 *
 * Sampled a short way *inside* the edge rather than on it: encoding and any resampling
 * disturb the outermost row of pixels, so measuring there reports a colour the eye never
 * sees, and the page background ends up matched to an artefact.
 */
async function edgeColour(file) {
  const meta = await sharp(file).metadata();
  const inset = 8;
  const band = 24;
  const strips = [
    { left: inset, top: inset, width: meta.width - inset * 2, height: band },
    { left: inset, top: meta.height - inset - band, width: meta.width - inset * 2, height: band },
    { left: inset, top: inset, width: band, height: meta.height - inset * 2 },
    { left: meta.width - inset - band, top: inset, width: band, height: meta.height - inset * 2 },
  ];

  const pixels = [];
  for (const strip of strips) {
    const { data, info } = await sharp(file)
      .extract(strip)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }

  return [0, 1, 2]
    .map((channel) => {
      const sorted = pixels.map((p) => p[channel]).sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)].toString(16).padStart(2, "0");
    })
    .join("");
}
