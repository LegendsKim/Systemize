import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calendarEventIdForSlot,
  ensureCalendarEvent,
  googleCalendarScope,
} from "../google-calendar-provider";
import { parseRetryAfter } from "../provider-error";
import { buildGoogleCalendarAuthorizationUrl } from "../google-oauth";

const credentials = {
  clientId: "calendar-client-id",
  clientSecret: "calendar-client-secret",
};

const connection = {
  refreshToken: "r".repeat(80),
  connectedEmail: "owner@gmail.com",
  grantedScopes: ["openid", "email", googleCalendarScope],
};

const input = {
  meetingSlotId: "e7000000-0000-4000-8000-000000000015",
  startsAt: "2026-08-01T13:00:00.000Z",
  endsAt: "2026-08-01T14:00:00.000Z",
  attendeeEmail: "client@gmail.com",
  zoomJoinUrl: "https://us06web.zoom.us/j/123456789",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Google Calendar meeting provisioning", () => {
  it("requests offline access with a CSRF state and the narrow calendar scope", () => {
    const authorizationUrl = new URL(
      buildGoogleCalendarAuthorizationUrl({
        redirectUri:
          "https://www.systemize.co.il/api/integrations/google/callback",
        state: "unique-state",
        loginHint: "owner@gmail.com",
        credentials,
      })
    );

    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.searchParams.get("access_type")).toBe("offline");
    expect(authorizationUrl.searchParams.get("state")).toBe("unique-state");
    expect(authorizationUrl.searchParams.get("scope")).toContain(
      googleCalendarScope
    );
  });

  it("uses a deterministic provider event ID", () => {
    expect(calendarEventIdForSlot(input.meetingSlotId)).toBe(
      "me7000000000040008000000000000015"
    );
  });

  it("creates one invite with Zoom, attendee, date and organizer reminders", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ access_token: "a".repeat(40), expires_in: 3600 })
      )
      .mockResolvedValueOnce(
        Response.json({
          id: calendarEventIdForSlot(input.meetingSlotId),
          htmlLink: "https://www.google.com/calendar/event?eid=test",
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureCalendarEvent(input, connection, credentials);

    expect(result.eventId).toBe(calendarEventIdForSlot(input.meetingSlotId));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [eventUrl, eventInit] = fetchMock.mock.calls[1]!;
    expect(String(eventUrl)).toContain("sendUpdates=all");
    const body = JSON.parse(String(eventInit?.body));
    expect(body).toMatchObject({
      id: calendarEventIdForSlot(input.meetingSlotId),
      location: input.zoomJoinUrl,
      attendees: [{ email: input.attendeeEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 60 },
        ],
      },
    });
  });

  it("reconciles a duplicate event after an ambiguous prior response", async () => {
    const eventId = calendarEventIdForSlot(input.meetingSlotId);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "a".repeat(40) }))
      .mockResolvedValueOnce(new Response(null, { status: 409 }))
      .mockResolvedValueOnce(
        Response.json({
          id: eventId,
          htmlLink: "https://www.google.com/calendar/event?eid=reconciled",
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureCalendarEvent(input, connection, credentials);

    expect(result.eventId).toBe(eventId);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]![0])).toContain(`/events/${eventId}`);
  });
});

describe("provider retry metadata", () => {
  it("bounds numeric and HTTP-date Retry-After values", () => {
    expect(parseRetryAfter("99999")).toBe(3600);
    expect(parseRetryAfter(new Date(Date.now() + 30_000).toUTCString())).toBeGreaterThanOrEqual(29);
    expect(parseRetryAfter("invalid")).toBeNull();
  });
});
