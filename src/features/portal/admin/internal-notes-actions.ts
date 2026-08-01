"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminActionState } from "@/features/portal/admin/action-state";
import { internalNotesFormSchema } from "@/features/portal/admin/internal-notes";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Saves the operator's private notes on a project.
 *
 * A plain upsert rather than a `SECURITY DEFINER` RPC, on purpose. The RPCs elsewhere in
 * this feature exist because their mutations are multi-table, need an idempotency key, or
 * fan out notifications. This one touches a single owner-only row, creates no client-facing
 * effect, and notifies nobody — routing it through a definer function would add a second
 * place where the authorization rule lives without making anything safer.
 *
 * `updated_by` is written from the verified session, and the row policy's `WITH CHECK`
 * requires it to equal `auth.uid()`, so a forged field in the form cannot attribute a note
 * to somebody else.
 */
export async function saveProjectInternalNotes(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const identity = await requireSystemizeOwner();
  const parsed = internalNotesFormSchema.safeParse({
    projectId: formData.get("projectId"),
    impression: formData.get("impression"),
    budgetSignal: formData.get("budgetSignal"),
    readiness: formData.get("readiness"),
    risks: formData.get("risks"),
    flags: formData.get("flags"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "לא ניתן לשמור את ההערות. יש לקצר את הטקסט ולנסות שוב.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("project_internal_notes").upsert(
    {
      project_id: parsed.data.projectId,
      impression: parsed.data.impression,
      budget_signal: parsed.data.budgetSignal,
      readiness: parsed.data.readiness,
      risks: parsed.data.risks,
      flags: parsed.data.flags,
      updated_by: identity.userId,
    },
    { onConflict: "project_id" }
  );

  if (error) {
    // The row holds candid commercial judgement. The code identifies the fault; the
    // message could quote the note itself.
    return {
      status: "error",
      message: "לא ניתן לשמור את ההערות כרגע. הטקסט נשאר במסך.",
    };
  }

  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  redirect(`/admin/projects/${parsed.data.projectId}?notice=internal-notes-saved`);
}
