import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureZoomMeeting } from "../zoom-provider";

const credentials = {
  accountId: "zoom-account",
  clientId: "zoom-client",
  clientSecret: "zoom-secret",
  hostUserId: "owner@gmail.com",
};

const input = {
  meetingSlotId: "e7000000-0000-4000-8000-000000000015",
  startsAt: "2026-08-01T13:00:00.000Z",
  endsAt: "2026-08-01T14:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Zoom meeting provisioning", () => {
  it("reconciles before creating and sends a safe scheduled meeting", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "a".repeat(40) }))
      .mockResolvedValueOnce(
        Response.json({ meetings: [], next_page_token: "" })
      )
      .mockResolvedValueOnce(
        Response.json({
          id: 123456789,
          join_url: "https://us06web.zoom.us/j/123456789",
          agenda: `systemize-slot:${input.meetingSlotId}`,
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureZoomMeeting(input, credentials);

    expect(result).toEqual({
      meetingId: "123456789",
      joinUrl: "https://us06web.zoom.us/j/123456789",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = JSON.parse(String(fetchMock.mock.calls[2]![1]?.body));
    expect(body).toMatchObject({
      type: 2,
      duration: 60,
      agenda: `systemize-slot:${input.meetingSlotId}`,
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    });
    expect(body).not.toHaveProperty("start_url");
  });

  it("reuses a prior meeting instead of creating a duplicate", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "a".repeat(40) }))
      .mockResolvedValueOnce(
        Response.json({
          meetings: [
            {
              id: 987654321,
              join_url: "https://zoom.us/j/987654321",
              agenda: `systemize-slot:${input.meetingSlotId}`,
            },
          ],
          next_page_token: "",
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await ensureZoomMeeting(input, credentials);

    expect(result.meetingId).toBe("987654321");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
