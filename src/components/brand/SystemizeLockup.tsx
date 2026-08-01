import { SystemizeMark } from "@/components/brand/SystemizeMark";
import { siteName } from "@/lib/site-config";

interface SystemizeLockupProps {
  readonly className?: string;
  /**
   * Play the assembly: the two halves arrive from opposite sides and lock together.
   * Reserved for entrances, a logo that reassembles on every page would be a tic.
   */
  readonly animated?: boolean;
}

/**
 * The full brand lockup — the mark and the name — exactly as the site header carries it.
 *
 * `dir="ltr"` because the lockup is a Latin run and must not be reordered by the RTL
 * document; the mark is documented as non-directional and is deliberately never mirrored.
 * That is also why the assembly below is written with `translateX` rather than a logical
 * offset: inside this island "left" and "right" are fixed by the lockup's own direction,
 * not by the page's, so a logical property would be the wrong tool rather than the
 * careful one.
 *
 * The animation is decorative and collapses to its final frame under
 * `prefers-reduced-motion`, courtesy of the global rule in globals.css. The wordmark's
 * letter-spacing opens from tight to its set value as it lands, which is what makes the
 * two halves read as connecting rather than merely sliding.
 */
export function SystemizeLockup({ className, animated }: SystemizeLockupProps) {
  return (
    <span
      className={`brand-lockup${className ? ` ${className}` : ""}`}
      dir="ltr"
      data-animated={animated ? "true" : undefined}
    >
      <SystemizeMark className="brand-lockup-mark" />
      <span className="brand-lockup-name">{siteName}</span>
    </span>
  );
}
