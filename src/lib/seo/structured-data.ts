import { faqEntries } from "@/features/faq/faq-content";
import { absoluteUrl } from "@/lib/seo/page-metadata";
import { contact, siteDescription, siteName, siteTagline } from "@/lib/site-config";

/**
 * Structured data for the home page.
 *
 * AGENTS.client.md §3 requires `ProfessionalService` and `FAQPage`, and AGENTS.md §9
 * requires both to derive from the same source as the visible content. That is the whole
 * design constraint of this module: **it contains no strings of its own.** Every value is
 * read from the content module that renders it, so a schema field cannot say something the
 * page does not.
 *
 * Field provenance:
 *
 *   - `name`, `description`, `slogan`, `src/lib/site-config.ts`. `siteDescription` is the
 *     site's one plain sentence about the offer and is also the meta description;
 *     `siteTagline` is the tagline in the document title.
 *   - `mainEntity`, `src/features/faq/faq-content.ts`, verbatim. That module's answers are
 *     deliberately plain strings for exactly this reason.
 *
 *   - `telephone`, `src/lib/site-config.ts`, in the E.164 form schema.org expects. Supplied
 *     by the owner, and the same number the footer and the WhatsApp launcher dial.
 * Fields still deliberately absent: `address`, `areaServed`, `openingHours`,
 * `aggregateRating`, `priceRange`. None is verified, and `ProfessionalService` is a `LocalBusiness`
 * subtype where an invented address is a factual claim about a real business, not filler.
 * They stay out until the owner supplies them.
 */

/** A JSON-LD node. Untyped values by nature, the vocabulary is schema.org, not TypeScript. */
export type JsonLdNode = Readonly<Record<string, unknown>>;

/** Stable node identifier, so the two blocks can reference each other if needed. */
const organizationId = () => absoluteUrl("/#organization");

function professionalService(): JsonLdNode {
  return {
    "@type": "ProfessionalService",
    "@id": organizationId(),
    name: siteName,
    slogan: siteTagline,
    description: siteDescription,
    url: absoluteUrl("/"),
    telephone: contact.tel,
    inLanguage: "he",
  };
}

function faqPage(): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq"),
    inLanguage: "he",
    mainEntity: faqEntries.map((entry) => ({
      "@type": "Question",
      "@id": absoluteUrl(`/#${entry.id}`),
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

/**
 * One `@graph` rather than two script tags: the FAQ and the business are on the same URL,
 * and a single graph lets `provider` reference the business by `@id` instead of repeating
 * it inside every offer.
 */
export function homeStructuredData(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [professionalService(), faqPage()],
  };
}
