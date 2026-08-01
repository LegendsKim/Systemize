import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DocumentVersionStatus,
} from "@/lib/supabase/types";
import {
  introductorySummaryContentSchema,
  type IntroductorySummaryContent,
} from "@/features/portal/documents/introductory-summary";
import {
  systemPlanContentSchema,
  type SystemPlanContent,
} from "@/features/portal/documents/system-plan";

interface DocumentVersionSnapshotBase {
  readonly id: string;
  readonly documentId: string;
  readonly projectId: string;
  readonly projectName?: string;
  readonly versionNumber: number;
  readonly status: DocumentVersionStatus;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly publishedAt: string | null;
}

export interface IntroductoryDocumentVersionSnapshot
  extends DocumentVersionSnapshotBase {
  readonly kind: "introductory_summary";
  readonly content: IntroductorySummaryContent;
}

export interface SystemPlanDocumentVersionSnapshot
  extends DocumentVersionSnapshotBase {
  readonly kind: "discovery_plan";
  readonly content: SystemPlanContent;
}

export type DocumentVersionSnapshot =
  | IntroductoryDocumentVersionSnapshot
  | SystemPlanDocumentVersionSnapshot;

interface ProjectDocumentSnapshotBase {
  readonly id: string;
  readonly projectId: string;
}

export interface IntroductoryDocumentSnapshot
  extends ProjectDocumentSnapshotBase {
  readonly kind: "introductory_summary";
  readonly versions: readonly IntroductoryDocumentVersionSnapshot[];
  readonly latestDraft: IntroductoryDocumentVersionSnapshot | null;
  readonly latestPublished: IntroductoryDocumentVersionSnapshot | null;
}

export interface SystemPlanDocumentSnapshot extends ProjectDocumentSnapshotBase {
  readonly kind: "discovery_plan";
  readonly versions: readonly SystemPlanDocumentVersionSnapshot[];
  readonly latestDraft: SystemPlanDocumentVersionSnapshot | null;
  readonly latestPublished: SystemPlanDocumentVersionSnapshot | null;
}

export type ProjectDocumentSnapshot =
  | IntroductoryDocumentSnapshot
  | SystemPlanDocumentSnapshot;

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
    if (!document) {
      continue;
    }
    const base = {
      id: version.id,
      documentId: version.document_id,
      projectId: document.project_id,
      versionNumber: version.version_number,
      status: version.status,
      contentHash: version.content_hash,
      createdAt: version.created_at,
      publishedAt: version.published_at,
    };
    let snapshot: DocumentVersionSnapshot;
    if (document.kind === "introductory_summary") {
      const parsed = introductorySummaryContentSchema.safeParse(version.content);
      if (!parsed.success) continue;
      snapshot = { ...base, kind: document.kind, content: parsed.data };
    } else if (document.kind === "discovery_plan") {
      const parsed = systemPlanContentSchema.safeParse(version.content);
      if (!parsed.success) continue;
      snapshot = { ...base, kind: document.kind, content: parsed.data };
    } else {
      continue;
    }
    const bucket = versionsByDocument.get(document.id) ?? [];
    bucket.push(snapshot);
    versionsByDocument.set(document.id, bucket);
  }

  return documents.flatMap((document): ProjectDocumentSnapshot[] => {
    if (
      document.kind !== "introductory_summary" &&
      document.kind !== "discovery_plan"
    ) {
      return [];
    }
    const documentVersions = versionsByDocument.get(document.id) ?? [];
    if (document.kind === "introductory_summary") {
      const versions = documentVersions.filter(
        (version): version is IntroductoryDocumentVersionSnapshot =>
          version.kind === "introductory_summary"
      );
      return [{
        id: document.id,
        projectId: document.project_id,
        kind: document.kind,
        versions,
        latestDraft: versions.find((version) => version.status === "draft") ?? null,
        latestPublished: versions.find((version) => version.status === "published") ?? null,
      }];
    }
    const versions = documentVersions.filter(
      (version): version is SystemPlanDocumentVersionSnapshot =>
        version.kind === "discovery_plan"
    );
    return [{
      id: document.id,
      projectId: document.project_id,
      kind: document.kind,
      versions,
      latestDraft:
        versions.find((version) => version.status === "draft") ?? null,
      latestPublished:
        versions.find((version) => version.status === "published") ?? null,
    }];
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

  if (
    documentError ||
    !document ||
    (document.kind !== "introductory_summary" &&
      document.kind !== "discovery_plan")
  ) {
    return null;
  }

  const content =
    document.kind === "introductory_summary"
      ? introductorySummaryContentSchema.safeParse(version.content)
      : systemPlanContentSchema.safeParse(version.content);
  if (!content.success) {
    throw new Error("Document content does not match its schema version");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", document.project_id)
    .maybeSingle();

  const base = {
    id: version.id,
    documentId: document.id,
    projectId: document.project_id,
    projectName: project?.name,
    versionNumber: version.version_number,
    status: version.status,
    contentHash: version.content_hash,
    createdAt: version.created_at,
    publishedAt: version.published_at,
  };
  return document.kind === "introductory_summary"
    ? { ...base, kind: document.kind, content: content.data as IntroductorySummaryContent }
    : { ...base, kind: document.kind, content: content.data as SystemPlanContent };
}
