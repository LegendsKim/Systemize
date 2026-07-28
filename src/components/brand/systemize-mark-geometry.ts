/**
 * Canonical Systemize mark geometry.
 *
 * Static SVGs are generated from this object by `scripts/generate-brand-assets.ts`.
 * The metadata image imports it directly. Keep this the only editable geometry source.
 */
export const systemizeMarkGeometry = {
  viewBox: "0 0 24 24",
  tightViewBox: "2.2 4.1 19.6 15.8",
  path: "M8 5L3 12L8 19M16 5L21 12L16 19",
  accentPath: "M10 8H14M10 12H14M10 16H14",
  strokeWidth: 1.25,
  opticalBounds: { x: 2.2, y: 4.1, width: 19.6, height: 15.8 },
} as const;

export const systemizeBrandColors = {
  ink: "#2b3440",
  deepInk: "#20262f",
  teal: "#008f8a",
  lightTeal: "#4bb8c4",
  paper: "#f5f6f7",
} as const;

interface MarkSvgOptions {
  readonly ink: string;
  readonly accent?: string;
  readonly viewBox?: string;
}

/** Serialises the canonical geometry for static and Satori SVG consumers. */
export function systemizeMarkSvg({
  ink,
  accent,
  viewBox = systemizeMarkGeometry.viewBox,
}: MarkSvgOptions): string {
  const geometry = systemizeMarkGeometry;
  const bridgeStroke = `<path d="${geometry.accentPath}" stroke="${accent ?? ink}" stroke-width="${geometry.strokeWidth}" stroke-linecap="butt"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">` +
    `<path d="${geometry.path}" stroke="${ink}" stroke-width="${geometry.strokeWidth}" ` +
    'stroke-linecap="butt" stroke-linejoin="miter"/>' +
    bridgeStroke +
    "</svg>"
  );
}
