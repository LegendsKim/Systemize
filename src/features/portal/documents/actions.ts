"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AdminActionState } from "@/features/portal/admin/action-state";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import type { Json } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildIntroductorySummaryContent,
  introductorySummaryFormSchema,
} from "./introductory-summary";
import {
  buildSystemPlanContent,
  systemPlanEditorSchema,
} from "./system-plan";
import { schedulePushOutboxDrain } from "@/server/push/schedule";

const documentMutationResultSchema = z.object({
  document_id: z.string().uuid(),
  version_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  content_hash: z.string().regex(/^[0-9a-f]{64}$/),
  status: z.enum(["draft", "published"]),
  replayed: z.boolean(),
});

export async function saveIntroductorySummaryDraft(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSystemizeOwner();
  const parsed = introductorySummaryFormSchema.safeParse({
    projectId: formData.get("projectId"),
    documentId: formData.get("documentId"),
    versionId: formData.get("versionId"),
    idempotencyKey: formData.get("idempotencyKey"),
    title: formData.get("title"),
    currentSituation: formData.get("currentSituation"),
    operationalFriction: formData.get("operationalFriction"),
    desiredOutcomes: formData.get("desiredOutcomes"),
    scopeAndAssumptions: formData.get("scopeAndAssumptions"),
    openQuestions: formData.get("openQuestions"),
    discoveryIncludes: formData.get("discoveryIncludes"),
    deliverables: formData.get("deliverables"),
    estimatedTimeline: formData.get("estimatedTimeline"),
    priceIls: formData.get("priceIls"),
    paymentTerms: formData.get("paymentTerms"),
    exclusions: formData.get("exclusions"),
    validityDays: formData.get("validityDays"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "יש להשלים את השדות המסומנים לפני שמירת הגרסה.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,company_id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { status: "error", message: "לא ניתן לזהות את הפרויקט." };
  }

  const [{ data: company, error: companyError }, { data: contacts, error: contactsError }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("name")
        .eq("id", project.company_id)
        .maybeSingle(),
      supabase
        .from("company_people")
        .select("full_name,email,phone")
        .eq("company_id", project.company_id)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

  if (companyError || contactsError || !company) {
    return {
      status: "error",
      message: "לא ניתן לטעון את פרטי החברה ואנשי הקשר.",
    };
  }

  const content = buildIntroductorySummaryContent({
    parsed: parsed.data,
    companyName: company.name,
    contacts: contacts.map((contact) => ({
      fullName: contact.full_name,
      email: contact.email,
      phone: contact.phone,
    })),
    now: new Date(),
  });

  const { data, error } = await supabase.rpc("create_document_draft", {
    p_document_id: parsed.data.documentId,
    p_version_id: parsed.data.versionId,
    p_project_id: parsed.data.projectId,
    p_kind: "introductory_summary",
    p_content: content as Json,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    return {
      status: "error",
      message: "לא ניתן לשמור את גרסת המסמך כרגע.",
    };
  }

  const result = documentMutationResultSchema.safeParse(data);
  if (!result.success || result.data.status !== "draft") {
    throw new Error("Unexpected create_document_draft response");
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?tab=documents&notice=document-draft-saved`
  );
}

const systemPlanMutationSchema = z.object({
  projectId: z.string().uuid(),
  documentId: z.string().uuid(),
  versionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  contentPayload: z.string().min(2).max(100_000),
});

export async function saveSystemPlanDraft(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSystemizeOwner();
  const mutation = systemPlanMutationSchema.safeParse({
    projectId: formData.get("projectId"),
    documentId: formData.get("documentId"),
    versionId: formData.get("versionId"),
    idempotencyKey: formData.get("idempotencyKey"),
    contentPayload: formData.get("contentPayload"),
  });

  if (!mutation.success) {
    return { status: "error", message: "פרטי שמירת המסמך אינם תקינים." };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(mutation.data.contentPayload);
  } catch {
    return { status: "error", message: "תוכן המסמך אינו JSON תקין." };
  }

  const editor = systemPlanEditorSchema.safeParse(decoded);
  if (!editor.success) {
    return {
      status: "error",
      message: "יש להשלים את השדות והמחירים לפני שמירת הגרסה.",
      fieldErrors: editor.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: project, error: projectError }, { data: existingDocument }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,company_id,name")
        .eq("id", mutation.data.projectId)
        .maybeSingle(),
      supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", mutation.data.projectId)
        .eq("kind", "discovery_plan")
        .maybeSingle(),
    ]);

  if (projectError || !project) {
    return { status: "error", message: "לא ניתן לזהות את הפרויקט." };
  }

  const [{ data: company }, { count: paidCount, error: paymentError }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("name")
        .eq("id", project.company_id)
        .maybeSingle(),
      supabase
        .from("payment_requests")
        .select("id", { head: true, count: "exact" })
        .eq("project_id", project.id)
        .eq("status", "paid"),
    ]);

  if (!company || paymentError) {
    return { status: "error", message: "לא ניתן לטעון את נתוני המסמך." };
  }
  if (!paidCount && !existingDocument) {
    return {
      status: "error",
      message: "מסמך התכנון נפתח לאחר קבלת התשלום עבור שלב האפיון.",
    };
  }

  const content = buildSystemPlanContent({
    editor: editor.data,
    companyName: company.name,
    projectName: project.name,
    now: new Date(),
  });
  const { data, error } = await supabase.rpc("create_document_draft", {
    p_document_id: mutation.data.documentId,
    p_version_id: mutation.data.versionId,
    p_project_id: project.id,
    p_kind: "discovery_plan",
    p_content: content as Json,
    p_idempotency_key: mutation.data.idempotencyKey,
  });

  if (error) {
    return { status: "error", message: "לא ניתן לשמור את גרסת מסמך התכנון כרגע." };
  }
  const result = documentMutationResultSchema.safeParse(data);
  if (!result.success || result.data.status !== "draft") {
    throw new Error("Unexpected system plan draft response");
  }

  revalidatePath(`/admin/projects/${project.id}`);
  redirect(
    `/admin/projects/${project.id}?tab=documents&notice=document-draft-saved`
  );
}

const publishDocumentSchema = z.object({
  projectId: z.string().uuid(),
  versionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export async function publishDocumentVersion(
  formData: FormData
): Promise<void> {
  await requireSystemizeOwner();
  const parsed = publishDocumentSchema.safeParse({
    projectId: formData.get("projectId"),
    versionId: formData.get("versionId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    redirect("/admin?notice=document-publish-invalid");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("publish_document_version", {
    p_project_id: parsed.data.projectId,
    p_version_id: parsed.data.versionId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    redirect(
      `/admin/projects/${parsed.data.projectId}?tab=documents&notice=document-publish-failed`
    );
  }

  const result = documentMutationResultSchema.safeParse(data);
  if (!result.success || result.data.status !== "published") {
    throw new Error("Unexpected publish_document_version response");
  }

  schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  revalidatePath("/portal/documents");
  revalidatePath("/portal/notifications");
  redirect(
    `/admin/projects/${parsed.data.projectId}?tab=documents&notice=document-published`
  );
}
