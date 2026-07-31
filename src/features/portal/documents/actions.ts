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
    `/admin/projects/${parsed.data.projectId}?notice=document-draft-saved`
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
      `/admin/projects/${parsed.data.projectId}?notice=document-publish-failed`
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
    `/admin/projects/${parsed.data.projectId}?notice=document-published`
  );
}
