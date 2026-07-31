import { getPortalIdentity } from "@/features/portal/auth/session";
import { renderIntroductorySummaryPdf } from "@/features/portal/documents/introductory-summary-pdf";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDocumentVersion } from "@/server/repositories/document.repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PdfRouteContext {
  readonly params: Promise<{ versionId: string }>;
}

export async function GET(request: Request, { params }: PdfRouteContext) {
  const identity = await getPortalIdentity();
  if (!identity) {
    return Response.redirect(new URL("/login", request.url), 303);
  }

  const { versionId } = await params;
  const supabase = await createServerSupabaseClient();
  const version = await getDocumentVersion(supabase, versionId);

  if (!version) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const pdf = await renderIntroductorySummaryPdf(version);
  const filename = `systemize-summary-v${version.versionNumber}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
