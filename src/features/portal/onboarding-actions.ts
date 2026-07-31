"use server";

import { revalidatePath } from "next/cache";
import { requirePortalIdentity } from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Marks the one-time orientation as done for the signed-in client.
 *
 * Idempotent at the database, so a double tap or a replayed request keeps the first
 * timestamp. Failure is reported rather than thrown: the orientation is information, and
 * being unable to record that it was read must not block the person from continuing.
 */
export async function completePortalOnboarding(): Promise<{
  readonly ok: boolean;
}> {
  await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("complete_portal_onboarding");

  if (error) {
    return { ok: false };
  }

  revalidatePath("/portal");
  return { ok: true };
}
