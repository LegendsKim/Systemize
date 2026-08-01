import "server-only";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export interface GoogleCalendarConnectionStatus {
  readonly connected: boolean;
  readonly connectedEmail: string | null;
}

/**
 * Returns only the operator-safe connection summary. The provider refresh token never
 * leaves this server-only repository, even though the underlying RPC also needs it for
 * the dispatcher.
 */
export async function getGoogleCalendarConnectionStatus(): Promise<GoogleCalendarConnectionStatus> {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin.rpc("get_google_calendar_connection");

  if (error) {
    throw new Error(`calendar_connection_status_failed:${error.code ?? "unknown"}`);
  }

  const connection = data?.[0];
  return {
    connected: Boolean(connection),
    connectedEmail: connection?.connected_email ?? null,
  };
}

/**
 * Explicit owner retries must be able to recover provider work that exhausted its
 * automatic attempts. Authorization remains in the Server Action; this repository
 * only exposes the service-role RPC and never provider credentials.
 */
export async function requeueUnfinishedMeetingIntegrations(): Promise<number> {
  const admin = getAdminSupabaseClient();
  const { data, error } = await admin.rpc("requeue_meeting_integrations");

  if (error) {
    throw new Error(`meeting_requeue_failed:${error.code ?? "unknown"}`);
  }

  return data;
}
