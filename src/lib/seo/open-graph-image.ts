import { siteName, siteTagline } from "@/lib/site-config";

/**
 * The one description of the Open Graph card, shared by the route that generates it and
 * the routes that reference it.
 *
 * A stable public path is intentional. Social crawlers cache previews aggressively, and
 * Next's metadata file convention may emit a build-specific query string. Keeping the
 * card at one immutable-looking URL makes WhatsApp and similar crawlers much less likely
 * to retain a failed or obsolete generated URL.
 *
 * Every route restates the image from this shared descriptor. The path is relative:
 * `metadataBase` in the root layout resolves it against `siteUrl`, and no host is written
 * down.
 */

/** Stable public crawler asset. Matches `public/systemize-share-card.png`. */
export const openGraphImagePath = "/systemize-share-card.png";

export const openGraphImageSize = { width: 1200, height: 630 } as const;

export const openGraphImageAlt = `${siteName} | ${siteTagline}`;

/** Metadata `images` entry for a route that declares its own `openGraph` block. */
export const openGraphImageDescriptor = {
  url: openGraphImagePath,
  width: openGraphImageSize.width,
  height: openGraphImageSize.height,
  alt: openGraphImageAlt,
} as const;
