import Image from "next/image";
import { founderContent } from "../founder-content";

/**
 * Founder section.
 *
 * Two states are real, not hypothetical, and both are handled here:
 *
 *   `portrait: null`, no photograph exists. The section renders a vector medallion in the
 *   portrait's place instead of an empty frame, a grey box, or an `<img>` pointing at an
 *   invented asset path. The medallion is decorative and `aria-hidden`, because the name it
 *   stands for is already the adjacent visible text; giving it alternative text would make
 *   a screen reader announce the name twice.
 *
 *   `credentials: []`, nothing is verified yet. The block is omitted entirely rather than
 *   rendered as an empty list with a heading, so the layout has no hole to explain.
 *
 * Neither state is a defect to be styled around: until the owner supplies real material,
 * these are the correct values, and inventing a biography or a photograph would be a false
 * claim about a real person.
 *
 * A Server Component. When a portrait does arrive it is rendered with `next/image` and the
 * intrinsic dimensions carried by the content module, so the space is reserved before the
 * file loads.
 */

const MEDALLION_SIZE = 240;

/** Initials for the medallion, derived from the name so the two can never disagree. */
const initials = founderContent.name
  .split(" ")
  .map((word) => word.charAt(0))
  .join("׳");

export function FounderProfile() {
  const { portrait, credentials } = founderContent;

  return (
    <section id="founder" className="founder-section" aria-labelledby="founder-heading">
      <div className="founder-inner">
        <div className="founder-portrait">
          {portrait ? (
            <Image
              className="founder-portrait-image"
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              sizes="(min-width: 60rem) 22rem, 60vw"
            />
          ) : (
            /*
             * The stand-in: concentric contours from the hero's visual language, with the
             * initials at the centre. Vector and CSS only, no asset path is invented.
             */
            <svg
              className="founder-medallion"
              viewBox="0 0 240 240"
              width={MEDALLION_SIZE}
              height={MEDALLION_SIZE}
              aria-hidden="true"
              focusable="false"
            >
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="120" cy="120" r="118" opacity="0.35" />
                <circle cx="120" cy="120" r="98" opacity="0.3" />
                <circle cx="120" cy="120" r="78" opacity="0.25" />
                <circle cx="120" cy="120" r="58" opacity="0.2" />
                <circle cx="120" cy="120" r="38" opacity="0.15" />
              </g>
              <circle
                cx="120"
                cy="120"
                r="108"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                strokeDasharray="4 10"
                opacity="0.7"
              />
              <text
                x="120"
                y="120"
                textAnchor="middle"
                dominantBaseline="central"
                className="founder-medallion-initials"
              >
                {initials}
              </text>
            </svg>
          )}

          <p className="founder-name">{founderContent.name}</p>
          <p className="founder-role">{founderContent.role}</p>
        </div>

        <div className="founder-copy">
          <p className="founder-eyebrow">{founderContent.eyebrow}</p>
          <h2 id="founder-heading">{founderContent.headline}</h2>

          {founderContent.paragraphs.map((paragraph) => (
            <p key={paragraph} className="founder-paragraph">
              {paragraph}
            </p>
          ))}

          <p className="founder-pledge">{founderContent.pledge}</p>

          {credentials.length > 0 && (
            <dl className="founder-credentials">
              {credentials.map((credential) => (
                <div key={credential.id} className="founder-credential">
                  <dt>{credential.label}</dt>
                  <dd>{credential.detail}</dd>
                </div>
              ))}
            </dl>
          )}

          <a className="founder-cta" href={founderContent.ctaHref}>
            <span>{founderContent.ctaLabel}</span>
            <svg
              viewBox="0 0 16 16"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M8 2.5v11M3.5 9l4.5 4.5L12.5 9" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
