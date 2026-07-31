import "server-only";
import { z } from "zod";
import {
  getGoogleCalendarClientCredentials,
  type GoogleCalendarClientCredentials,
} from "@/lib/env/server";
import {
  classifyProviderStatus,
  MeetingProviderError,
  providerFetch,
} from "./provider-error";

export const googleCalendarScope =
  "https://www.googleapis.com/auth/calendar.events.owned";

const accessTokenSchema = z.object({
  access_token: z.string().min(20).max(4096),
});

const tokenErrorSchema = z.object({
  error: z.string().max(100),
});

const eventSchema = z.object({
  id: z.string().regex(/^[0-9a-v]{5,1024}$/),
  htmlLink: z.string().url().max(1000).optional(),
});

export interface GoogleCalendarConnection {
  readonly refreshToken: string;
  readonly connectedEmail: string;
  readonly grantedScopes: readonly string[];
}

export interface CalendarEventInput {
  readonly meetingSlotId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly attendeeEmail: string;
  readonly zoomJoinUrl: string;
}

export interface CalendarEventResult {
  readonly eventId: string;
  readonly eventUrl: string | null;
}

export function calendarEventIdForSlot(slotId: string): string {
  const compact = slotId.replaceAll("-", "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compact)) {
    throw new MeetingProviderError("invalid_request", "calendar_slot_id_invalid");
  }
  return `m${compact}`;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
  credentials = getGoogleCalendarClientCredentials()
): Promise<string> {
  if (!credentials) {
    throw new MeetingProviderError("configuration", "google_not_configured");
  }
  const response = await providerFetch(
    "google",
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    }
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const tokenError = tokenErrorSchema.safeParse(payload);
    if (tokenError.success && tokenError.data.error === "invalid_grant") {
      throw new MeetingProviderError("configuration", "google_reconnect_required");
    }
    throw classifyProviderStatus("google", response);
  }
  const parsed = accessTokenSchema.safeParse(payload);
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "google_token_response_invalid");
  }
  return parsed.data.access_token;
}

async function getExistingEvent(
  accessToken: string,
  eventId: string
): Promise<CalendarEventResult> {
  const response = await providerFetch(
    "google",
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw classifyProviderStatus("google", response);
  const parsed = eventSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "google_event_response_invalid");
  }
  return {
    eventId: parsed.data.id,
    eventUrl: parsed.data.htmlLink ?? null,
  };
}

export async function ensureCalendarEvent(
  input: CalendarEventInput,
  connection: GoogleCalendarConnection,
  credentials?: GoogleCalendarClientCredentials | null
): Promise<CalendarEventResult> {
  if (!connection.grantedScopes.includes(googleCalendarScope)) {
    throw new MeetingProviderError("configuration", "google_scope_missing");
  }
  if (!/^[^@\s]+@gmail\.com$/i.test(input.attendeeEmail)) {
    throw new MeetingProviderError("invalid_request", "calendar_attendee_invalid");
  }
  const eventId = calendarEventIdForSlot(input.meetingSlotId);
  const accessToken = await refreshGoogleAccessToken(
    connection.refreshToken,
    credentials === undefined ? getGoogleCalendarClientCredentials() : credentials
  );
  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  url.searchParams.set("sendUpdates", "all");
  const response = await providerFetch("google", url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
      summary: "פגישת מיקוד – SYSTEMIZE",
      description:
        "פגישת המיקוד של SYSTEMIZE. אפשר להצטרף דרך קישור ה-Zoom המצורף.",
      location: input.zoomJoinUrl,
      start: { dateTime: new Date(input.startsAt).toISOString(), timeZone: "UTC" },
      end: { dateTime: new Date(input.endsAt).toISOString(), timeZone: "UTC" },
      attendees: [{ email: input.attendeeEmail }],
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 60 },
        ],
      },
    }),
  });
  if (response.status === 409) {
    return getExistingEvent(accessToken, eventId);
  }
  if (!response.ok) throw classifyProviderStatus("google", response);
  const parsed = eventSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "google_event_response_invalid");
  }
  return {
    eventId: parsed.data.id,
    eventUrl: parsed.data.htmlLink ?? null,
  };
}
