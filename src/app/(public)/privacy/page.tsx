import type { Metadata } from "next";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { privacyDocument } from "@/features/legal/legal-content";
import { pageMetadata } from "@/lib/seo/page-metadata";

/**
 * A standalone indexable route, not a modal, docs/PRODUCT.md §3.1 and
 * AGENTS.client.md §3 both require it, and the sitemap already listed it.
 *
 * Title, description and canonical all derive from the same content module the page
 * renders, so the metadata cannot describe a page other than this one.
 */
export const metadata: Metadata = pageMetadata({
  path: privacyDocument.path,
  title: privacyDocument.title,
  description: privacyDocument.description,
});

export default function PrivacyPage() {
  return <LegalDocumentPage legalDocument={privacyDocument} />;
}
