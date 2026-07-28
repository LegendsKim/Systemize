import type { Metadata } from "next";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { accessibilityDocument } from "@/features/legal/legal-content";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: accessibilityDocument.path,
  title: accessibilityDocument.title,
  description: accessibilityDocument.description,
});

export default function AccessibilityPage() {
  return <LegalDocumentPage legalDocument={accessibilityDocument} />;
}
