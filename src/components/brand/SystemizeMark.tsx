import { systemizeMarkGeometry } from "./systemize-mark-geometry";

interface SystemizeMarkProps {
  readonly className?: string;
}

/**
 * The Systemize mark: code turns business activity into an ordered system.
 *
 * Construction: a 24 × 24 integer grid; vertices only at integer coordinates; horizontal
 * and 45° segments only; one 1.25-unit monoline with butt caps and mitre joins. A pair of
 * code brackets contains three aligned process lines: software on the outside, organised
 * operations on the inside. The mark is intentionally monochrome; quality comes from
 * proportion and construction, not colour.
 *
 * The optical bounds inside the 0 0 24 24 viewBox are approximately x=2.2…21.8 and
 * y=4.1…19.9.
 * The geometry is non-directional and is intentionally not mirrored in RTL.
 *
 * Inline SVG keeps it crisp at any size. It is decorative; the wrapping link supplies
 * the accessible name.
 *
 * The geometry is mirrored into `src/app/icon.svg` and the Open Graph image. All three,
 * plus the `brand/` exports, must change together via `npm run brand:generate`.
 */
export function SystemizeMark({ className }: SystemizeMarkProps) {
  const geometry = systemizeMarkGeometry;

  return (
    <svg
      className={className}
      viewBox={geometry.viewBox}
      width="36"
      height="36"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={geometry.path}
        fill="none"
        stroke="currentColor"
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <path
        d={geometry.accentPath}
        stroke="currentColor"
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="butt"
      />
    </svg>
  );
}
