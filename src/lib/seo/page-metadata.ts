import type { Metadata } from "next";
import { openGraphImageDescriptor } from "@/lib/seo/open-graph-image";
import { siteName, siteUrl } from "@/lib/site-config";

/**
 * Route-level metadata.
 *
 * `src/app/layout.tsx` already establishes `metadataBase`, the title template, the site
 * defaults and the home page's canonical. This helper exists for the routes *below* that
 * layout, and it exists because Next.js does not deep-merge `openGraph` or `twitter`: a
 * page that sets `openGraph.title` and nothing else loses the parent's `siteName`,
 * `locale` and `type`. So each route restates the social block in full, from one function,
 * rather than each page restating it by hand and drifting.
 *
 * Nothing here hardcodes a host. `metadataBase` in the root layout resolves the relative
 * `canonical` and `openGraph.url` against `siteUrl`, which reads `NEXT_PUBLIC_SITE_URL`
 * and falls back to the development origin, the canonical host is still an open owner
 * decision (AGENTS.client.md §3), and setting that one variable is the whole release
 * change.
 *
 * The Open Graph image has to be restated for the same reason, see
 * `src/lib/seo/open-graph-image.ts`, which is where its one description lives.
 */
export interface PageMetadataInput {
  /** Route path, leading slash, e.g. `/privacy`. Resolved against `metadataBase`. */
  readonly path: string;
  /** Route title without the site name, the root template appends that. */
  readonly title: string;
  readonly description: string;
  /**
   * Explicit crawl policy. Every route states it rather than inheriting silently, which
   * is what AGENTS.md §9 asks for. Defaults to indexable because every route this site
   * currently has is public.
   */
  readonly indexable?: boolean;
}

export function pageMetadata({
  path,
  title,
  description,
  indexable = true,
}: PageMetadataInput): Metadata {
  // The title template only applies to the document title. Social cards receive a
  // resolved string, so the suffix is applied here as well.
  const socialTitle = `${title} | ${siteName}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: indexable,
      follow: indexable,
    },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName,
      title: socialTitle,
      description,
      url: path,
      images: [openGraphImageDescriptor],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [openGraphImageDescriptor],
    },
  };
}

/** Absolute URL for a route path, resolved against the configured origin. */
export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}
