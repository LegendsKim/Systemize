import { siteName, siteTagline } from "@/lib/site-config";

/**
 * The one description of the Open Graph card, shared by the route that generates it and
 * the routes that reference it.
 *
 * This module exists because of a specific Next.js behaviour that is easy to ship broken:
 * the `opengraph-image` file convention is resolved into a segment's metadata, and a
 * deeper segment that exports its own `openGraph` object *replaces* that resolution
 * wholesale, including the images. The home page inherits the root layout's `openGraph`
 * and therefore keeps the generated card, but `/privacy`, `/terms` and `/accessibility`
 * each need a route-appropriate `og:title`, and the moment they declare one the card
 * disappears from them. It was verified missing from the rendered HTML before this module
 * existed.
 *
 * So the image is restated on those routes, from here, once, next to the size the
 * generator actually uses, so the two cannot drift. The path is relative: `metadataBase`
 * in the root layout resolves it against `siteUrl`, and no host is written down.
 */

/** Route Next.js serves the generated card from. Matches `src/app/opengraph-image.tsx`. */
export const openGraphImagePath = "/opengraph-image";

export const openGraphImageSize = { width: 1200, height: 630 } as const;

export const openGraphImageAlt = `${siteName} | ${siteTagline}`;

/** Metadata `images` entry for a route that declares its own `openGraph` block. */
export const openGraphImageDescriptor = {
  url: openGraphImagePath,
  width: openGraphImageSize.width,
  height: openGraphImageSize.height,
  alt: openGraphImageAlt,
} as const;
