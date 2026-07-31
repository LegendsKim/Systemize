"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { dispatchMeetingIntegrations } from "@/server/meetings/meeting-dispatcher";

export async function retryMeetingIntegrations(): Promise<void> {
  await requireSystemizeOwner();

  let notice = "meeting-integrations-failed";
  try {
    const result = await dispatchMeetingIntegrations(5);
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
  } catch {
    notice = "meeting-integrations-failed";
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  redirect(`/admin?notice=${notice}`);
}
