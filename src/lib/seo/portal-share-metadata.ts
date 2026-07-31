import type { Metadata } from "next";
import { siteName } from "@/lib/site-config";

export const portalShareImagePath = "/portal-share-card.png";

export const portalShareImageDescriptor = {
  url: portalShareImagePath,
  width: 1200,
  height: 630,
  alt: "הזמנה אישית ל־SYSTEMIZE PORTAL",
} as const;

interface PortalShareMetadataInput {
  readonly path: string;
  readonly title: string;
  readonly description: string;
}

/**
 * Public social metadata for non-indexable portal links.
 *
 * WhatsApp has no authenticated session, so the preview must be useful without reading
 * a company, project, recipient, or invitation record. The card is deliberately generic:
 * a shared token may identify access, but its preview never identifies the customer.
 */
export function portalShareMetadata({
  path,
  title,
  description,
}: PortalShareMetadataInput): Metadata {
  const socialTitle = `${title} | ${siteName}`;

  return {
    title,
    description,
    robots: { index: false, follow: false, noarchive: true },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName,
      title: socialTitle,
      description,
      url: path,
      images: [portalShareImageDescriptor],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [portalShareImageDescriptor],
    },
  };
}
