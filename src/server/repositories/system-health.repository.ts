import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  buildSystemHealthSnapshot,
  type SystemHealthSnapshot,
} from "@/server/system-health/system-health-model";

const transitionSchema = z.object({
  failed: z.array(z.string()).max(5),
  recovered: z.array(z.string()).max(5),
});

export interface SystemHealthTransitions {
  readonly failed: readonly string[];
  readonly recovered: readonly string[];
}

export async function getSystemHealthSnapshot(
  supabase: SupabaseClient<Database>
): Promise<SystemHealthSnapshot> {
  const { data, error } = await supabase
    .from("system_health_checks")
    .select("component,status,error_code,checked_at,status_changed_at")
    .order("component");
  if (error) throw new Error("system_health_load_failed");
  return buildSystemHealthSnapshot(data, new Date());
}

export async function recordSystemHealthSnapshot(
  checks: readonly {
    readonly component: string;
    readonly status: "healthy" | "unhealthy";
    readonly error_code: string | null;
  }[]
): Promise<SystemHealthTransitions> {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin.rpc("record_system_health_snapshot", {
    p_checks: checks.map((check) => ({ ...check })),
  });
  if (error) throw new Error(`system_health_record_failed:${error.code ?? "unknown"}`);
  const parsed = transitionSchema.safeParse(data);
  if (!parsed.success) throw new Error("system_health_transition_invalid");
  return parsed.data;
}
