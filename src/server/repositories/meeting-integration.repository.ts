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

  const connection = data[0];
  return {
    connected: Boolean(connection),
    connectedEmail: connection?.connected_email ?? null,
  };
}
