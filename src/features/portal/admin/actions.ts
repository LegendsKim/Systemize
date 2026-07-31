"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AdminActionState } from "@/features/portal/admin/action-state";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import {
  companyPersonSchema,
  companyProjectSchema,
  invitationLifecycleSchema,
  invitationReissueSchema,
  projectDetailsSchema,
  projectInvitationSchema,
} from "@/features/portal/admin/schemas";
import { hashInvitationToken } from "@/features/portal/invitations/tokens";
import { siteUrl } from "@/lib/site-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const companyProjectResultSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  replayed: z.boolean(),
});

export async function createCompanyProject(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSystemizeOwner();
  const parsed = companyProjectSchema.safeParse({
    companyName: formData.get("companyName"),
    projectName: formData.get("projectName"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_company_project", {
    p_company_id: randomUUID(),
    p_project_id: randomUUID(),
    p_company_name: parsed.data.companyName,
    p_project_name: parsed.data.projectName,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    return {
      status: "error",
      message: "לא ניתן ליצור את החברה והפרויקט כרגע.",
    };
  }

  const result = companyProjectResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Unexpected create_company_project response");
  }

  revalidatePath("/admin");
  redirect(`/admin/projects/${result.data.project_id}`);
}

const invitationResultSchema = z.object({
  invitation_id: z.string().uuid(),
  project_id: z.string().uuid(),
  expires_at: z.string(),
  replayed: z.boolean(),
});

export async function createProjectInvitation(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSystemizeOwner();
  const parsed = projectInvitationSchema.safeParse({
    projectId: formData.get("projectId"),
    invitationId: formData.get("invitationId"),
    invitationToken: formData.get("invitationToken"),
    idempotencyKey: formData.get("idempotencyKey"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_project_invitation", {
    p_invitation_id: parsed.data.invitationId,
    p_project_id: parsed.data.projectId,
    p_full_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_token_hash: hashInvitationToken(parsed.data.invitationToken),
    p_idempotency_key: parsed.data.idempotencyKey,
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return {
      status: "error",
      message: "לא ניתן ליצור את ההזמנה כרגע.",
    };
  }

  const result = invitationResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error("Unexpected create_project_invitation response");
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return {
    status: "success",
    message: "ההזמנה נוצרה. זה הקישור היחיד שניתן להעתיק.",
    shareUrl: new URL(
      `/invite/${parsed.data.invitationToken}`,
      siteUrl
    ).toString(),
  };
}

const invitationLifecycleResultSchema = z.object({
  invitation_id: z.string().uuid(),
  project_id: z.string().uuid(),
  replayed: z.boolean(),
});

export async function revokeProjectInvitation(
  formData: FormData
): Promise<void> {
  await requireSystemizeOwner();
  const parsed = invitationLifecycleSchema.safeParse({
    projectId: formData.get("projectId"),
    invitationId: formData.get("invitationId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    redirect("/admin?notice=invalid-invitation");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("revoke_project_invitation", {
    p_invitation_id: parsed.data.invitationId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    redirect(
      `/admin/projects/${parsed.data.projectId}?notice=invitation-revoke-failed`
    );
  }

  const result = invitationLifecycleResultSchema.safeParse(data);
  if (!result.success || result.data.project_id !== parsed.data.projectId) {
    throw new Error("Unexpected revoke_project_invitation response");
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=invitation-revoked`
  );
}

export async function reissueProjectInvitation(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireSystemizeOwner();
  const parsed = invitationReissueSchema.safeParse({
    projectId: formData.get("projectId"),
    invitationId: formData.get("invitationId"),
    replacementInvitationId: formData.get("replacementInvitationId"),
    invitationToken: formData.get("invitationToken"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "לא ניתן לזהות את ההזמנה שצריך להפיק מחדש.",
    };
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("reissue_project_invitation", {
    p_source_invitation_id: parsed.data.invitationId,
    p_invitation_id: parsed.data.replacementInvitationId,
    p_token_hash: hashInvitationToken(parsed.data.invitationToken),
    p_idempotency_key: parsed.data.idempotencyKey,
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return {
      status: "error",
      message: "לא ניתן להפיק הזמנה חלופית כרגע.",
    };
  }

  const result = invitationResultSchema.safeParse(data);
  if (!result.success || result.data.project_id !== parsed.data.projectId) {
    throw new Error("Unexpected reissue_project_invitation response");
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  return {
    status: "success",
    message:
      "ההזמנה הקודמת בוטלה ונוצר קישור חדש. הקישור מוצג פעם אחת בלבד.",
    shareUrl: new URL(
      `/invite/${parsed.data.invitationToken}`,
      siteUrl
    ).toString(),
  };
}

const projectMutationResultSchema = z.object({
  project_id: z.string().uuid(),
  replayed: z.boolean(),
});

export async function updateProjectDetails(formData: FormData): Promise<void> {
  await requireSystemizeOwner();
  const parsed = projectDetailsSchema.safeParse({
    projectId: formData.get("projectId"),
    companyName: formData.get("companyName"),
    projectName: formData.get("projectName"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    redirect("/admin?notice=invalid-project-details");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("update_project_details", {
    p_project_id: parsed.data.projectId,
    p_company_name: parsed.data.companyName,
    p_project_name: parsed.data.projectName,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    redirect(
      `/admin/projects/${parsed.data.projectId}?notice=project-details-failed`
    );
  }

  const result = projectMutationResultSchema.safeParse(data);
  if (!result.success || result.data.project_id !== parsed.data.projectId) {
    throw new Error("Unexpected update_project_details response");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath("/portal");
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=project-details-updated`
  );
}

export async function updateCompanyPerson(formData: FormData): Promise<void> {
  await requireSystemizeOwner();
  const parsed = companyPersonSchema.safeParse({
    projectId: formData.get("projectId"),
    personId: formData.get("personId"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    idempotencyKey: formData.get("idempotencyKey"),
  });

  if (!parsed.success) {
    redirect("/admin?notice=contact-invalid");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("update_company_person", {
    p_project_id: parsed.data.projectId,
    p_person_id: parsed.data.personId,
    p_full_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    const notice = error.message.includes("activated_contact_email_immutable")
      ? "contact-email-locked"
      : "contact-update-failed";
    redirect(`/admin/projects/${parsed.data.projectId}?notice=${notice}`);
  }

  const result = projectMutationResultSchema
    .extend({
      person_id: z.string().uuid(),
      email_changed: z.boolean(),
    })
    .safeParse(data);
  if (!result.success || result.data.project_id !== parsed.data.projectId) {
    throw new Error("Unexpected update_company_person response");
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=${
      result.data.email_changed
        ? "contact-updated-invitation-revoked"
        : "contact-updated"
    }`
  );
}
