"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { dispatchMeetingIntegrations } from "@/server/meetings/meeting-dispatcher";
import { requeueUnfinishedMeetingIntegrations } from "@/server/repositories/meeting-integration.repository";

export async function retryMeetingIntegrations(): Promise<void> {
  await requireSystemizeOwner();

  let notice = "meeting-integrations-failed";
  try {
    const requeued = await requeueUnfinishedMeetingIntegrations();
    const result = await dispatchMeetingIntegrations(5);
    console.info(
      JSON.stringify({
        level: "info",
        message: "meeting_integration_manual_retry",
        claimed: result.claimed,
        delivered: result.delivered,
        retried: result.retried,
        attention: result.attention,
        configured: result.configured,
        calendarConnected: result.calendarConnected,
        requeued,
      })
    );
    if (!result.configured) {
      notice = "meeting-providers-not-configured";
    } else if (!result.calendarConnected) {
      notice = "google-calendar-connect-required";
    } else if (result.delivered > 0) {
      notice = "meeting-integrations-ready";
    } else if (result.attention > 0) {
      notice = "meeting-integrations-attention";
    } else if (result.retried > 0) {
      notice = "meeting-integrations-retrying";
    } else {
      notice = "meeting-integrations-no-work";
    }
  } catch (error: unknown) {
    const safeError =
      error instanceof Error && /^[a-z0-9_:.-]{1,160}$/i.test(error.message)
        ? error.message
        : "unknown";
    console.error(
      JSON.stringify({
        level: "error",
        message: "meeting_integration_manual_retry_failed",
        error: safeError,
      })
    );
    notice =
      error instanceof Error &&
      /^zoom_(account_id|client_id|client_secret|host_user_id)_(missing|too_long)$/.test(
        error.message
      )
        ? error.message
        : "meeting-integrations-failed";
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  redirect(`/admin?notice=${notice}`);
}
