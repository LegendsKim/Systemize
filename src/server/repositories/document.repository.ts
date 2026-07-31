import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DocumentVersionStatus,
  ProjectDocumentKind,
} from "@/lib/supabase/types";
import {
  introductorySummaryContentSchema,
  type IntroductorySummaryContent,
} from "@/features/portal/documents/introductory-summary";

export interface DocumentVersionSnapshot {
  readonly id: string;
  readonly documentId: string;
  readonly projectId: string;
  readonly kind: ProjectDocumentKind;
  readonly versionNumber: number;
  readonly status: DocumentVersionStatus;
  readonly content: IntroductorySummaryContent;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly publishedAt: string | null;
}

export interface ProjectDocumentSnapshot {
  readonly id: string;
  readonly projectId: string;
  readonly kind: ProjectDocumentKind;
  readonly versions: readonly DocumentVersionSnapshot[];
  readonly latestDraft: DocumentVersionSnapshot | null;
  readonly latestPublished: DocumentVersionSnapshot | null;
}

export async function listProjectDocuments(
  supabase: SupabaseClient<Database>,
  projectIds: readonly string[]
): Promise<readonly ProjectDocumentSnapshot[]> {
  if (projectIds.length === 0) {
    return [];
  }

  const { data: documents, error: documentsError } = await supabase
    .from("project_documents")
    .select("id,project_id,kind")
    .in("project_id", [...projectIds])
    .order("created_at", { ascending: false });

  if (documentsError) {
    throw new Error("Unable to load project documents");
  }
  if (documents.length === 0) {
    return [];
  }

  const documentIds = documents.map((document) => document.id);
  const { data: versions, error: versionsError } = await supabase
    .from("document_versions")
    .select(
      "id,document_id,version_number,status,content,content_hash,created_at,published_at"
    )
    .in("document_id", documentIds)
    .order("version_number", { ascending: false })
    .limit(Math.min(documentIds.length * 25, 250));

  if (versionsError) {
    throw new Error("Unable to load document versions");
  }

  const documentById = new Map(
    documents.map((document) => [document.id, document])
  );
  const versionsByDocument = new Map<string, DocumentVersionSnapshot[]>();

  for (const version of versions) {
    const document = documentById.get(version.document_id);
    if (!document || document.kind !== "introductory_summary") {
      continue;
    }
    const parsed = introductorySummaryContentSchema.safeParse(version.content);
    if (!parsed.success) {
      continue;
    }
    const snapshot: DocumentVersionSnapshot = {
      id: version.id,
      documentId: version.document_id,
      projectId: document.project_id,
      kind: document.kind,
      versionNumber: version.version_number,
      status: version.status,
      content: parsed.data,
      contentHash: version.content_hash,
      createdAt: version.created_at,
      publishedAt: version.published_at,
    };
    const bucket = versionsByDocument.get(document.id) ?? [];
    bucket.push(snapshot);
    versionsByDocument.set(document.id, bucket);
  }

  return documents.map((document) => {
    const documentVersions = versionsByDocument.get(document.id) ?? [];
    return {
      id: document.id,
      projectId: document.project_id,
      kind: document.kind,
      versions: documentVersions,
      latestDraft:
        documentVersions.find((version) => version.status === "draft") ?? null,
      latestPublished:
        documentVersions.find((version) => version.status === "published") ??
        null,
    };
  });
}

export async function getDocumentVersion(
  supabase: SupabaseClient<Database>,
  versionId: string
): Promise<DocumentVersionSnapshot | null> {
  const { data: version, error: versionError } = await supabase
    .from("document_versions")
    .select(
      "id,document_id,version_number,status,content,content_hash,created_at,published_at"
    )
    .eq("id", versionId)
    .maybeSingle();

  if (versionError || !version) {
    return null;
  }

  const { data: document, error: documentError } = await supabase
    .from("project_documents")
    .select("id,project_id,kind")
    .eq("id", version.document_id)
    .maybeSingle();

  if (documentError || !document || document.kind !== "introductory_summary") {
    return null;
  }

  const content = introductorySummaryContentSchema.safeParse(version.content);
  if (!content.success) {
    throw new Error("Document content does not match its schema version");
  }

  return {
    id: version.id,
    documentId: document.id,
    projectId: document.project_id,
    kind: document.kind,
    versionNumber: version.version_number,
    status: version.status,
    content: content.data,
    contentHash: version.content_hash,
    createdAt: version.created_at,
    publishedAt: version.published_at,
  };
}
