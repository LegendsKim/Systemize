/**
 * Regenerates the hero background plates served from `public/hero/`.
 *
 * Run with `node scripts/prepare-hero-plates.mjs` after replacing a master render in
 * `docs/design/`. Masters are the original 3D renders and are never served directly.
 *
 * Why this step exists
 * -------------------
 * The masters are 1672x941 and 941x1672. On a 2560px monitor — and far worse at 2x
 * device pixel ratio — the image optimizer would have to stretch them, which is what
 * makes a smooth render look soft and banded. Upscaling once here with a Lanczos
 * resampler gives the optimizer real pixels to downscale from at every breakpoint.
 *
 * The artwork is broad gradients plus fine contour lines, close to the ideal case for
 * Lanczos; the light sharpen restores the contour crispness that resampling softens.
 *
 * Output is quality-95 WebP rather than PNG. At this content and quality the difference
 * is invisible, the optimizer re-encodes to AVIF anyway, and it keeps roughly 20MB of
 * lossless intermediates out of the repository.
 *
 * If a plate is replaced, re-check two things that depend on its pixel dimensions:
 *   - the aspect ratios in `src/features/hero/hero-geometry.ts`
 *   - the sampled field colours `--color-hero-field*` in `src/app/globals.css`, which
 *     must keep matching the plate's border exactly or a seam becomes visible
 */
import sharp from "sharp";

const UPSCALE = 2;

const plates = [
  { master: "docs/design/hero-plate-landscape.png", out: "public/hero/hero-desktop.webp" },
  { master: "docs/design/hero-plate-portrait.png", out: "public/hero/hero-mobile.webp" },
];

for (const plate of plates) {
  const { width, height } = await sharp(plate.master).metadata();

  await sharp(plate.master)
    .resize({ width: width * UPSCALE, kernel: "lanczos3" })
    .sharpen({ sigma: 0.7, m1: 0.4, m2: 0.6 })
    .webp({ quality: 95, effort: 6 })
    .toFile(plate.out);

  const stats = await sharp(plate.out).stats();
  const border = await sharp(plate.out)
    .extract({ left: 0, top: Math.round(height * UPSCALE * 0.4), width: 24, height: 24 })
    .stats();
  const hex = border.channels
    .slice(0, 3)
    .map((c) => Math.round(c.mean).toString(16).padStart(2, "0"))
    .join("");

  console.log(
    `${plate.out}: ${width}x${height} -> ${width * UPSCALE}x${height * UPSCALE}, border #${hex}${
      stats.isOpaque ? "" : " (has alpha)"
    }`
  );
}

console.log("\nConfirm the border colours above still match --color-hero-field* in globals.css.");
