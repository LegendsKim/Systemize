"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { schedulePushOutboxDrain } from "@/server/push/schedule";
import { monitorSystemHealth } from "@/server/system-health/system-health-monitor";

export async function runSystemHealthCheck(): Promise<void> {
  await requireSystemizeOwner();
  let notice = "system-health-checked";
  try {
    await monitorSystemHealth();
    schedulePushOutboxDrain();
  } catch {
    notice = "system-health-check-failed";
  }
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/notifications");
  redirect(`/admin/settings?notice=${notice}`);
}
