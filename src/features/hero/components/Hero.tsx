import type { CSSProperties } from "react";
import { getImageProps } from "next/image";
import { landscapePlate } from "../hero-geometry";
import { HeroMilestones } from "./HeroMilestones";
import { HeroTrail } from "./HeroTrail";

/**
 * Hero section.
 *
 * Two compositions from one set of markup:
 *
 *   landscape — the topographic plate, with the trail and its milestones plotted on the
 *               artwork and the copy beside it on the open left
 *   portrait  — no plate at all: the same copy, the same four milestones as a vertical
 *               track, and the brand's rings drifting behind it
 *
 * A wide panorama squeezed into a tall frame loses the composition that makes it worth
 * showing, and costs a megabyte on the connection where it hurts most. So phones get a
 * hero built from type, vector and motion instead, and the largest element on the page
 * becomes text — it paints almost immediately.
 *
 * Crucially the headline and the milestone links are written once and restyled, not
 * duplicated per orientation. Rendering both compositions would put two `<h1>`s and two
 * sets of the same anchors in the document for a crawler to find.
 *
 * A Server Component: every animation here is CSS, so the first server and client render
 * are identical and none of this reaches the client bundle.
 */

const HEADLINE = [
  "לא",
  "מתאימים",
  "את",
  "העסק",
  "למערכת.",
  "בונים",
  "את",
  "המערכת",
  "סביב",
  "העסק.",
];

/**
 * The condition under which the plate is shown. It must stay in step with the matching
 * query in `hero.css`, so the image and the stage geometry appear together.
 *
 * Orientation is part of it deliberately. A 768px-wide portrait tablet satisfies a
 * width-only query, but this artwork is a wide panorama — on a tall screen it would be
 * reduced to a sliver stranded in the middle of the section.
 */
const PLATE_MEDIA = "(min-width: 768px) and (min-aspect-ratio: 1/1)";

/**
 * Must be one of the values allowed by `images.qualities` in `next.config.ts`; Next.js
 * silently falls back to the default otherwise. The plate is a smooth render whose broad
 * gradients band visibly at the default quality.
 */
const PLATE_QUALITY = 90;

/**
 * A 1x1 transparent GIF.
 *
 * This is the `<img>` fallback inside the `<picture>`, and it is what keeps a megabyte of
 * artwork off a phone. `display: none` does not reliably prevent an image from being
 * fetched, but a `<source>` whose media query does not match is never selected — so on a
 * portrait viewport the browser resolves to this instead and downloads 43 bytes.
 */
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function Hero() {
  const {
    props: { srcSet: plateSrcSet },
  } = getImageProps({
    alt: "",
    sizes: "100vw",
    src: "/hero/hero-landscape.webp",
    width: landscapePlate.width,
    height: landscapePlate.height,
    quality: PLATE_QUALITY,
  });

  return (
    <section className="hero" aria-labelledby="hero-heading">
      {/* Decorative layer. `dir="ltr"` because the artwork is a picture, not text: its
          coordinates are measured from the image's left edge in either page direction. */}
      <div className="hero-stage hero-stage--art" dir="ltr" aria-hidden="true">
        <picture>
          <source media={PLATE_MEDIA} srcSet={plateSrcSet} />
          {/* A raw <img> is required here: art direction via getImageProps. See the
              docblock above and the recorded exception in AGENTS.client.md §3. */}
          <img
            className="hero-plate"
            src={TRANSPARENT_PIXEL}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <HeroTrail />
      </div>

      {/* Portrait only: the wordmark's rings, drifting behind the copy. */}
      <div className="hero-rings" aria-hidden="true">
        <span className="hero-ring hero-ring--1" />
        <span className="hero-ring hero-ring--2" />
        <span className="hero-ring hero-ring--3" />
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="hero-eyebrow-rule" aria-hidden="true" />
            מערכות שעובדות בדרך שבה העסק שלך עובד
          </p>

          <h1 id="hero-heading" className="hero-heading">
            {HEADLINE.map((word, index) => (
              <span
                key={`${index}-${word}`}
                className="hero-word"
                style={{ "--hero-word-delay": `${0.26 + index * 0.055}s` } as CSSProperties}
              >
                {word}
              </span>
            ))}
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

      <HeroMilestones />
    </section>
  );
}
