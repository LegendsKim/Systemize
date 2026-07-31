"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requirePortalIdentity,
  requireSystemizeOwner,
} from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasIntakeFieldErrors,
  intakeReplyMaximumLength,
  intakeReviewSchema,
  meetingBookingSchema,
  meetingSlotSchema,
  parseIntakeForm,
  paymentReceivedSchema,
  paymentRequestSchema,
  projectWorkflowIdSchema,
} from "./schemas";
import { parseIntakeAnswers } from "./intake";
import type {
  IntakeActionState,
  WorkflowActionState,
  WorkflowFieldErrors,
} from "./action-state";
import { schedulePushOutboxDrain } from "@/server/push/schedule";
import { scheduleMeetingIntegrationDrain } from "@/server/meetings/schedule";

function errorState(
  message: string,
  fieldErrors?: WorkflowFieldErrors
): WorkflowActionState {
  return { status: "error", message, fieldErrors };
}

export async function saveClientIntake(
  _state: IntakeActionState,
  formData: FormData
): Promise<IntakeActionState> {
  await requirePortalIdentity();
  const projectIdResult = projectWorkflowIdSchema.safeParse(
    formData.get("projectId")
  );
  const currentStepResult = z.coerce.number().int().min(1).max(5).safeParse(
    formData.get("currentStep")
  );
  const idempotencyResult = z.string().uuid().safeParse(
    formData.get("idempotencyKey")
  );
  const submit = formData.get("intent") === "submit";
  const parsed = parseIntakeForm(formData, submit);
  // Every failure path below returns this, so no rejection can cost the client their text.
  const values = { answers: parsed.answers, clientReply: parsed.clientReply };

  if (
    !projectIdResult.success ||
    !currentStepResult.success ||
    !idempotencyResult.success
  ) {
    return {
      ...errorState("לא ניתן לשמור את המסמך. רעננו את העמוד ונסו שוב."),
      values,
    };
  }

  if (hasIntakeFieldErrors(parsed)) {
    return {
      ...errorState(
        "יש להשלים את השדות המסומנים לפני שליחת המסמך. מה שכתבתם נשמר במסך.",
        parsed.fieldErrors
      ),
      values,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("save_client_intake", {
    p_project_id: projectIdResult.data,
    p_answers: parsed.answers,
    p_current_step: currentStepResult.data,
    p_submit: submit,
    p_idempotency_key: idempotencyResult.data,
    p_client_reply: parsed.clientReply || null,
  });

  if (error) {
    return {
      ...errorState(
        error.message.includes("intake_locked")
          ? "המסמך כבר נשלח לבדיקה ואינו פתוח לעריכה."
          : "לא הצלחנו לשמור את המסמך כרגע. התוכן נשאר במסך וניתן לנסות שוב."
      ),
      values,
    };
  }

  schedulePushOutboxDrain();
  revalidatePath(`/portal/projects/${projectIdResult.data}`);
  revalidatePath(`/portal/projects/${projectIdResult.data}/discovery`);
  redirect(
    `/portal/projects/${projectIdResult.data}?notice=${
      submit ? "intake-submitted" : "draft-saved"
    }`
  );
}

export interface IntakeAutosaveResult {
  readonly status: "saved" | "locked" | "failed";
  readonly savedAt?: string;
}

/**
 * Background draft persistence, called while the client types.
 *
 * Deliberately not the same call as the button: it transitions nothing, notifies nobody,
 * and writes no idempotency record, because a last-write-wins draft upsert replayed twice
 * is the same draft. It also never redirects — the person is mid-sentence.
 */
export async function autosaveClientIntake(input: {
  readonly projectId: string;
  readonly currentStep: number;
  readonly answers: Record<string, string>;
  readonly clientReply: string;
}): Promise<IntakeAutosaveResult> {
  await requirePortalIdentity();
  const projectIdResult = projectWorkflowIdSchema.safeParse(input.projectId);
  const stepResult = z.coerce.number().int().min(1).max(5).safeParse(
    input.currentStep
  );
  if (!projectIdResult.success || !stepResult.success) {
    return { status: "failed" };
  }

  const answers = parseIntakeAnswers(input.answers);
  const clientReply =
    typeof input.clientReply === "string"
      ? input.clientReply.trim().slice(0, intakeReplyMaximumLength)
      : "";

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("autosave_client_intake", {
    p_project_id: projectIdResult.data,
    p_answers: answers,
    p_current_step: stepResult.data,
    p_client_reply: clientReply || null,
  });

  if (error) {
    return {
      status: error.message.includes("intake_locked") ? "locked" : "failed",
    };
  }

  return { status: "saved", savedAt: data ?? undefined };
}

export async function reviewClientIntake(formData: FormData): Promise<void> {
  await requireSystemizeOwner();
  const parsed = intakeReviewSchema.safeParse({
    projectId: formData.get("projectId"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    redirect("/admin?notice=invalid-review");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("review_client_intake", {
    p_project_id: parsed.data.projectId,
    p_decision: parsed.data.decision,
    p_review_note: parsed.data.reviewNote,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (!error) schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=${
      error ? "review-failed" : "review-saved"
    }`
  );
}

export async function createMeetingSlot(
  _state: WorkflowActionState,
  formData: FormData
): Promise<WorkflowActionState> {
  await requireSystemizeOwner();
  const parsed = meetingSlotSchema.safeParse({
    projectId: formData.get("projectId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    return errorState(
      parsed.error.issues[0]?.message ?? "פרטי המועד אינם תקינים."
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_meeting_slot", {
    p_project_id: parsed.data.projectId,
    p_starts_at: parsed.data.startsAt,
    p_ends_at: parsed.data.endsAt,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    return errorState("לא הצלחנו לפתוח את המועד. ודאו שהשאלון כבר אושר.");
  }

  schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(`/admin/projects/${parsed.data.projectId}?notice=slot-created`);
}

export async function bookMeetingSlot(formData: FormData): Promise<void> {
  await requirePortalIdentity();
  const parsed = meetingBookingSchema.safeParse({
    projectId: formData.get("projectId"),
    slotId: formData.get("slotId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    redirect("/portal?notice=invalid-meeting");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("book_meeting_slot", {
    p_project_id: parsed.data.projectId,
    p_slot_id: parsed.data.slotId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (!error) {
    schedulePushOutboxDrain();
    scheduleMeetingIntegrationDrain();
  }
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  redirect(
    `/portal/projects/${parsed.data.projectId}?notice=${
      error ? "booking-failed" : "meeting-booked"
    }`
  );
}

export async function completeProjectMeeting(formData: FormData): Promise<void> {
  await requireSystemizeOwner();
  const parsed = meetingBookingSchema.safeParse({
    projectId: formData.get("projectId"),
    slotId: formData.get("slotId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    redirect("/admin?notice=invalid-meeting");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("complete_project_meeting", {
    p_project_id: parsed.data.projectId,
    p_slot_id: parsed.data.slotId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (!error) schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=${
      error ? "meeting-update-failed" : "meeting-completed"
    }`
  );
}

export async function createPaymentRequest(
  _state: WorkflowActionState,
  formData: FormData
): Promise<WorkflowActionState> {
  await requireSystemizeOwner();
  const parsed = paymentRequestSchema.safeParse({
    projectId: formData.get("projectId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    amountIls: formData.get("amountIls"),
    paymentUrl: formData.get("paymentUrl"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    return errorState(
      "יש לתקן את פרטי התשלום.",
      parsed.error.flatten().fieldErrors
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_payment_request", {
    p_project_id: parsed.data.projectId,
    p_kind: parsed.data.kind,
    p_title: parsed.data.title,
    p_amount_agorot: Math.round(parsed.data.amountIls * 100),
    p_payment_url: parsed.data.paymentUrl,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    return errorState("לא הצלחנו לפרסם את בקשת התשלום כרגע.");
  }

  schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(`/admin/projects/${parsed.data.projectId}?notice=payment-created`);
}

export async function markPaymentReceived(formData: FormData): Promise<void> {
  await requireSystemizeOwner();
  const parsed = paymentReceivedSchema.safeParse({
    projectId: formData.get("projectId"),
    paymentRequestId: formData.get("paymentRequestId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) {
    redirect("/admin?notice=invalid-payment");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("mark_payment_received", {
    p_project_id: parsed.data.projectId,
    p_payment_request_id: parsed.data.paymentRequestId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (!error) schedulePushOutboxDrain();
  revalidatePath(`/admin/projects/${parsed.data.projectId}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  redirect(
    `/admin/projects/${parsed.data.projectId}?notice=${
      error ? "payment-update-failed" : "payment-received"
    }`
  );
}

export async function openNotification(formData: FormData): Promise<void> {
  const identity = await requirePortalIdentity();
  const notificationId = z.string().uuid().safeParse(
    formData.get("notificationId")
  );
  const rawHref = formData.get("href");
  const href =
    typeof rawHref === "string" &&
    (rawHref.startsWith("/portal/") || rawHref.startsWith("/admin/"))
      ? rawHref
      : identity.appRole === "systemize_owner"
        ? "/admin"
        : "/portal";

  if (!notificationId.success) {
    redirect(href);
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId.data)
    .eq("recipient_user_id", identity.userId);

  revalidatePath("/portal/notifications");
  revalidatePath("/admin/notifications");
  redirect(href);
}
