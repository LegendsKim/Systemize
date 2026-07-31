import Link from "next/link";
import { notFound } from "next/navigation";
import { IntroductorySummaryView } from "@/features/portal/documents/IntroductorySummaryView";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDocumentVersion } from "@/server/repositories/document.repository";

interface DocumentVersionPageProps {
  readonly params: Promise<{ versionId: string }>;
}

export default async function DocumentVersionPage({
  params,
}: DocumentVersionPageProps) {
  const { versionId } = await params;
  const supabase = await createServerSupabaseClient();
  const version = await getDocumentVersion(supabase, versionId);

  if (!version || version.status !== "published") {
    notFound();
  }

  return (
    <main id="main-content" className="portal-main">
      <div className="document-page-actions">
        <Link href="/portal/documents" className="portal-back-link">
          חזרה למסמכים
        </Link>
        <a
          href={`/api/documents/${version.id}/pdf`}
          className="portal-primary-action"
        >
          הורדת PDF
        </a>
      </div>
      <IntroductorySummaryView
        content={version.content}
        versionNumber={version.versionNumber}
        contentHash={version.contentHash}
        publishedAt={version.publishedAt}
      />
    </main>
  );
}
