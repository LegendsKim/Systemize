import type { Metadata } from "next";
import { LegalDocumentPage } from "@/features/legal/components/LegalDocumentPage";
import { termsDocument } from "@/features/legal/legal-content";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: termsDocument.path,
  title: termsDocument.title,
  description: termsDocument.description,
});

export default function TermsPage() {
  return <LegalDocumentPage legalDocument={termsDocument} />;
}
