import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface PushDeviceSummary {
  readonly id: string;
  readonly userAgent: string | null;
  readonly lastSeenAt: string;
}

export interface PushSettingsSnapshot {
  readonly devices: readonly PushDeviceSummary[];
  readonly mutedCategories: readonly string[];
}

export async function getPushSettingsSnapshot(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PushSettingsSnapshot> {
  const [devicesResult, preferencesResult] = await Promise.all([
    supabase
      .from("push_subscriptions")
      .select("id,user_agent,last_seen_at")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(20),
    supabase
      .from("notification_preferences")
      .select("muted_categories")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (devicesResult.error || preferencesResult.error) {
    throw new Error("Unable to load push settings");
  }

  return {
    devices: devicesResult.data.map((device) => ({
      id: device.id,
      userAgent: device.user_agent,
      lastSeenAt: device.last_seen_at,
    })),
    mutedCategories: preferencesResult.data?.muted_categories ?? [],
  };
}
