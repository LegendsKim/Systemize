import { getImageProps } from "next/image";
import { desktopPlate, mobilePlate, trailNodes } from "../hero-geometry";
import { HeroMilestones } from "./HeroMilestones";
import { HeroTrail } from "./HeroTrail";

/**
 * Viewport width at which the artwork switches from the portrait plate to the landscape
 * one. It must stay in step with the `48rem` breakpoint in `hero.css`, so the image and
 * the stage geometry flip at the same moment.
 */
const PLATE_BREAKPOINT = "(min-width: 768px)";

/**
 * Must be one of the values allowed by `images.qualities` in `next.config.ts`; Next.js
 * silently falls back to the default otherwise. The plates are smooth gradients, which
 * band visibly at the default quality.
 */
const HERO_QUALITY = 90;

/**
 * Hero section.
 *
 * The background is a `<picture>` built with `getImageProps()` — the art-direction
 * pattern documented for `next/image`. The two plates are genuinely different renders,
 * one landscape and one portrait, not one image at two sizes, so the `<Image>` component
 * on its own cannot express them. Going through `getImageProps` still gets the optimizer:
 * AVIF/WebP negotiation plus responsive and DPR variants, which matters because the hero
 * is displayed everywhere from a 360px phone to a 2560px monitor.
 *
 * The recorded exception in AGENTS.client.md §3 covers rendering the resulting `<img>`
 * directly. Explicit `width`/`height` reserve the layout box and `fetchPriority="high"`
 * marks the LCP candidate.
 */
export function Hero() {
  const common = { alt: "", sizes: "100vw" as const };

  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: "/hero/hero-desktop.webp",
    width: desktopPlate.width,
    height: desktopPlate.height,
    quality: HERO_QUALITY,
  });

  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({
    ...common,
    src: "/hero/hero-mobile.webp",
    width: mobilePlate.width,
    height: mobilePlate.height,
    quality: HERO_QUALITY,
  });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-stage" dir="ltr">
        <picture>
          <source media={PLATE_BREAKPOINT} srcSet={desktopSrcSet} />
          <source srcSet={mobileSrcSet} />
          {/* A raw <img> is required here: art direction via getImageProps. See the
              docblock above and the recorded exception in AGENTS.client.md §3. */}
          <img
            {...imgProps}
            className="hero-plate"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </picture>

        <HeroTrail plate={mobilePlate} nodes={trailNodes("mobile")} variant="mobile" />
        <HeroTrail plate={desktopPlate} nodes={trailNodes("desktop")} variant="desktop" />

        {/* Inside the stage and above the artwork, but below the markers: painted after
            them it would wash the markers out along with the background. */}
        <div className="hero-scrim" aria-hidden="true" />

        <HeroMilestones />
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="hero-eyebrow-rule" aria-hidden="true" />
            מערכות שעובדות בדרך שבה העסק שלך עובד
          </p>

          <h1 id="hero-heading" className="hero-heading">
            לא מתאימים את העסק למערכת. בונים את המערכת סביב העסק.
          </h1>

          <p className="hero-lead">
            מאפיינים את זרימת העבודה, מסירים צווארי בקבוק ובונים מערכת מדויקת — בלי
            פיצ׳רים מיותרים ובלי פתרונות מדף.
          </p>

          <div className="hero-actions">
            <a href="#blueprint" className="hero-cta">
              מתחילים באפיון
            </a>
            <a href="#process" className="hero-cta-secondary">
              לראות איך זה עובד
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
