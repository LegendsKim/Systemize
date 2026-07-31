import "server-only";
import { getPublicEnv } from "@/lib/env/client";
import {
  getGoogleCalendarClientCredentials,
  getWebPushServerCredentials,
} from "@/lib/env/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createNotificationProvider } from "@/server/adapters/notification";
import {
  googleCalendarScope,
  refreshGoogleAccessToken,
} from "@/server/meetings/google-calendar-provider";
import { MeetingProviderError } from "@/server/meetings/provider-error";
import { probeZoomConnection } from "@/server/meetings/zoom-provider";
import { recordSystemHealthSnapshot } from "@/server/repositories/system-health.repository";
import type { SystemHealthComponent } from "./system-health-model";

interface RecordedHealthCheck {
  readonly component: SystemHealthComponent;
  readonly status: "healthy" | "unhealthy";
  readonly error_code: string | null;
}

function safeErrorCode(error: unknown, fallback: string): string {
  if (error instanceof MeetingProviderError) return error.safeCode;
  if (error instanceof Error && /^[a-z0-9_:.-]{3,80}$/i.test(error.message)) {
    return error.message.toLowerCase();
  }
  return fallback;
}

async function probe(
  component: SystemHealthComponent,
  operation: () => Promise<void>,
  fallback: string
): Promise<RecordedHealthCheck> {
  try {
    await operation();
    return { component, status: "healthy", error_code: null };
  } catch (error: unknown) {
    return {
      component,
      status: "unhealthy",
      error_code: safeErrorCode(error, fallback),
    };
  }
}

async function probeDatabase(): Promise<void> {
  const admin = getAdminSupabaseClient();
  const { error } = await admin
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .eq("app_role", "systemize_owner");
  if (error) throw new Error(`database_probe_failed:${error.code ?? "unknown"}`);
}

async function probeGoogleCalendar(): Promise<void> {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin.rpc("get_google_calendar_connection");
  if (error) throw new Error(`google_connection_load_failed:${error.code ?? "unknown"}`);
  const connection = data?.[0];
  if (!connection) throw new Error("google_not_connected");
  if (!connection.granted_scopes.includes(googleCalendarScope)) {
    throw new MeetingProviderError("configuration", "google_scope_missing");
  }
  await refreshGoogleAccessToken(
    connection.refresh_token,
    getGoogleCalendarClientCredentials()
  );
}

async function probePushNotifications(): Promise<void> {
  const credentials = getWebPushServerCredentials();
  const publicKey = getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!credentials || !publicKey) throw new Error("push_not_configured");
  const admin = getAdminSupabaseClient();
  const { data: owners, error: ownerError } = await admin
    .from("profiles")
    .select("id")
    .eq("app_role", "systemize_owner")
    .limit(5);
  if (ownerError) throw new Error(`push_owner_load_failed:${ownerError.code ?? "unknown"}`);
  const ownerIds = owners.map((owner) => owner.id);
  if (ownerIds.length === 0) throw new Error("push_owner_missing");
  const { count, error } = await admin
    .from("push_subscriptions")
    .select("id", { head: true, count: "exact" })
    .in("user_id", ownerIds);
  if (error) throw new Error(`push_device_load_failed:${error.code ?? "unknown"}`);
  if (!count) throw new Error("push_owner_device_missing");
}

async function probeMeetingAutomation(): Promise<void> {
  const admin = getAdminSupabaseClient();
  const { count, error } = await admin
    .from("meeting_integrations")
    .select("meeting_slot_id", { head: true, count: "exact" })
    .eq("status", "attention");
  if (error) throw new Error(`meeting_health_load_failed:${error.code ?? "unknown"}`);
  if (count) throw new Error("meeting_attention_required");
}

export async function monitorSystemHealth(): Promise<{
  readonly checks: readonly RecordedHealthCheck[];
  readonly failed: readonly string[];
  readonly recovered: readonly string[];
}> {
  const checks = await Promise.all([
    probe("database", probeDatabase, "database_probe_failed"),
    probe("zoom", () => probeZoomConnection(), "zoom_probe_failed"),
    probe("google_calendar", probeGoogleCalendar, "google_probe_failed"),
    probe("push_notifications", probePushNotifications, "push_probe_failed"),
    probe("meeting_automation", probeMeetingAutomation, "meeting_probe_failed"),
  ]);
  const transitions = await recordSystemHealthSnapshot(checks);

  if (transitions.failed.length > 0 || transitions.recovered.length > 0) {
    try {
      const failed = transitions.failed.length > 0;
      await createNotificationProvider().send({
        type: "system_alert",
        subject: failed
          ? "תקלה במערכות SYSTEMIZE"
          : "מערכות SYSTEMIZE חזרו לפעול",
        body: failed
          ? "זוהתה תקלה בחיבור מערכת. הפרטים זמינים בהגדרות הניהול."
          : "בדיקת המערכות הסתיימה בהצלחה והחיבורים חזרו לפעול.",
        metadata: { transition: failed ? "failed" : "recovered" },
      });
    } catch {
      console.warn("system_health_telegram_deferred");
    }
  }

  return { checks, ...transitions };
}
