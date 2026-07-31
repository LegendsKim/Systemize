import "server-only";
import {
  getGoogleCalendarClientCredentials,
  getZoomServerCredentials,
} from "@/lib/env/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureCalendarEvent } from "./google-calendar-provider";
import {
  MeetingProviderError,
  shouldRetryProviderError,
} from "./provider-error";
import { ensureZoomMeeting } from "./zoom-provider";

export interface MeetingDispatchSummary {
  readonly claimed: number;
  readonly delivered: number;
  readonly retried: number;
  readonly attention: number;
  readonly configured: boolean;
  readonly calendarConnected: boolean;
}

export async function dispatchMeetingIntegrations(
  limit = 10
): Promise<MeetingDispatchSummary> {
  const zoomCredentials = getZoomServerCredentials();
  const googleCredentials = getGoogleCalendarClientCredentials();
  if (!zoomCredentials || !googleCredentials) {
    return {
      claimed: 0,
      delivered: 0,
      retried: 0,
      attention: 0,
      configured: false,
      calendarConnected: false,
    };
  }

  const admin = getAdminSupabaseClient();
  const { data: connections, error: connectionError } = await admin.rpc(
    "get_google_calendar_connection"
  );
  if (connectionError) {
    throw new Error(`calendar_connection_load_failed:${connectionError.code ?? "unknown"}`);
  }
  const connection = connections[0];
  if (!connection) {
    return {
      claimed: 0,
      delivered: 0,
      retried: 0,
      attention: 0,
      configured: true,
      calendarConnected: false,
    };
  }

  const { data: jobs, error: claimError } = await admin.rpc(
    "claim_meeting_integration_batch",
    { p_limit: Math.min(Math.max(limit, 1), 20) }
  );
  if (claimError) {
    throw new Error(`meeting_claim_failed:${claimError.code ?? "unknown"}`);
  }

  let delivered = 0;
  let retried = 0;
  let attention = 0;

  for (const job of jobs) {
    try {
      let zoomMeetingId = job.zoom_meeting_id;
      let zoomJoinUrl = job.zoom_join_url;
      if (!zoomMeetingId || !zoomJoinUrl) {
        const zoom = await ensureZoomMeeting(
          {
            meetingSlotId: job.meeting_slot_id,
            startsAt: job.starts_at,
            endsAt: job.ends_at,
          },
          zoomCredentials
        );
        zoomMeetingId = zoom.meetingId;
        zoomJoinUrl = zoom.joinUrl;
        const { error: recordError } = await admin.rpc("record_meeting_zoom", {
          p_meeting_slot_id: job.meeting_slot_id,
          p_zoom_meeting_id: zoomMeetingId,
          p_zoom_join_url: zoomJoinUrl,
        });
        if (recordError) {
          throw new Error(`meeting_zoom_record_failed:${recordError.code ?? "unknown"}`);
        }
      }

      const calendar = await ensureCalendarEvent(
        {
          meetingSlotId: job.meeting_slot_id,
          startsAt: job.starts_at,
          endsAt: job.ends_at,
          attendeeEmail: job.client_email,
          zoomJoinUrl,
        },
        {
          refreshToken: connection.refresh_token,
          connectedEmail: connection.connected_email,
          grantedScopes: connection.granted_scopes,
        },
        googleCredentials
      );
      const { error: settleError } = await admin.rpc(
        "settle_meeting_integration",
        {
          p_meeting_slot_id: job.meeting_slot_id,
          p_outcome: "ready",
          p_google_event_id: calendar.eventId,
          p_google_event_url: calendar.eventUrl,
          p_error_code: null,
          p_retry_after_seconds: null,
        }
      );
      if (settleError) {
        throw new Error(`meeting_settle_failed:${settleError.code ?? "unknown"}`);
      }
      delivered += 1;
    } catch (error: unknown) {
      const retry = shouldRetryProviderError(error) && job.attempts < 5;
      const safeCode =
        error instanceof MeetingProviderError
          ? error.safeCode
          : "meeting_internal_failure";
      const retryAfterSeconds =
        error instanceof MeetingProviderError ? error.retryAfterSeconds : null;
      const { error: settleError } = await admin.rpc(
        "settle_meeting_integration",
        {
          p_meeting_slot_id: job.meeting_slot_id,
          p_outcome: retry ? "retry" : "attention",
          p_google_event_id: null,
          p_google_event_url: null,
          p_error_code: safeCode,
          p_retry_after_seconds: retryAfterSeconds,
        }
      );
      if (settleError) {
        throw new Error(`meeting_settle_failed:${settleError.code ?? "unknown"}`);
      }
      if (retry) retried += 1;
      else attention += 1;
    }
  }

  return {
    claimed: jobs.length,
    delivered,
    retried,
    attention,
    configured: true,
    calendarConnected: true,
  };
}
