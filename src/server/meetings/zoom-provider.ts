import "server-only";
import { z } from "zod";
import {
  getZoomServerCredentials,
  type ZoomServerCredentials,
} from "@/lib/env/server";
import {
  classifyProviderStatus,
  MeetingProviderError,
  providerFetch,
} from "./provider-error";

const zoomUrl = z.string().url().refine((value) => {
  const hostname = new URL(value).hostname.toLowerCase();
  return hostname === "zoom.us" || hostname.endsWith(".zoom.us");
}, "Zoom returned an unexpected join URL");

const tokenSchema = z.object({
  access_token: z.string().min(20).max(4096),
});

const zoomErrorSchema = z.object({
  code: z.union([z.number().int(), z.string().max(80)]).optional(),
  error: z.string().max(80).optional(),
});

const meetingSchema = z.object({
  id: z.union([z.string().min(1), z.number().safe()]),
  join_url: zoomUrl,
  agenda: z.string().optional(),
});

const meetingListSchema = z.object({
  meetings: z.array(meetingSchema).max(300),
  next_page_token: z.string().max(500).optional().default(""),
});

export interface ZoomMeetingInput {
  readonly meetingSlotId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface ZoomMeetingResult {
  readonly meetingId: string;
  readonly joinUrl: string;
}

function markerFor(slotId: string): string {
  return `systemize-slot:${slotId}`;
}

async function zoomResponseError(
  stage: "token" | "list" | "create",
  response: Response
): Promise<MeetingProviderError> {
  const classified = classifyProviderStatus("zoom", response);
  const payload: unknown = await response.json().catch(() => null);
  const parsed = zoomErrorSchema.safeParse(payload);
  if (!parsed.success) return classified;

  const providerCode = parsed.data.code ?? parsed.data.error;
  const normalized = String(providerCode ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_-]/g, "_")
    .slice(0, 48);
  if (!normalized) return classified;

  return new MeetingProviderError(
    classified.category,
    `zoom_${stage}_${normalized}`,
    classified.retryAfterSeconds
  );
}

async function getAccessToken(
  credentials: ZoomServerCredentials
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: credentials.accountId,
  });
  const basic = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
    "utf8"
  ).toString("base64");
  const response = await providerFetch("zoom", "https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) throw await zoomResponseError("token", response);
  const parsed = tokenSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "zoom_token_response_invalid");
  }
  return parsed.data.access_token;
}

async function findExistingMeeting(
  credentials: ZoomServerCredentials,
  accessToken: string,
  marker: string
): Promise<ZoomMeetingResult | null> {
  let nextPageToken = "";
  for (let page = 0; page < 3; page += 1) {
    const url = new URL(
      `https://api.zoom.us/v2/users/${encodeURIComponent(credentials.hostUserId)}/meetings`
    );
    url.searchParams.set("type", "scheduled");
    url.searchParams.set("page_size", "100");
    if (nextPageToken) url.searchParams.set("next_page_token", nextPageToken);
    const response = await providerFetch("zoom", url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw await zoomResponseError("list", response);
    const parsed = meetingListSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new MeetingProviderError("permanent", "zoom_list_response_invalid");
    }
    const existing = parsed.data.meetings.find(
      (meeting) => meeting.agenda === marker
    );
    if (existing) {
      return {
        meetingId: String(existing.id),
        joinUrl: existing.join_url,
      };
    }
    nextPageToken = parsed.data.next_page_token;
    if (!nextPageToken) break;
  }
  return null;
}

/** Read-only provider probe used by the owner health monitor. */
export async function probeZoomConnection(
  credentials = getZoomServerCredentials()
): Promise<void> {
  if (!credentials) {
    throw new MeetingProviderError("configuration", "zoom_not_configured");
  }
  const accessToken = await getAccessToken(credentials);
  const url = new URL(
    `https://api.zoom.us/v2/users/${encodeURIComponent(credentials.hostUserId)}/meetings`
  );
  url.searchParams.set("type", "scheduled");
  url.searchParams.set("page_size", "1");
  const response = await providerFetch("zoom", url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw await zoomResponseError("list", response);
  const parsed = meetingListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "zoom_list_response_invalid");
  }
}

export async function ensureZoomMeeting(
  input: ZoomMeetingInput,
  credentials = getZoomServerCredentials()
): Promise<ZoomMeetingResult> {
  if (!credentials) {
    throw new MeetingProviderError("configuration", "zoom_not_configured");
  }
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const durationMinutes = Math.ceil(
    (endsAt.getTime() - startsAt.getTime()) / 60_000
  );
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    durationMinutes < 1 ||
    durationMinutes > 180
  ) {
    throw new MeetingProviderError("invalid_request", "zoom_time_invalid");
  }

  const accessToken = await getAccessToken(credentials);
  const marker = markerFor(input.meetingSlotId);
  const existing = await findExistingMeeting(credentials, accessToken, marker);
  if (existing) return existing;

  const response = await providerFetch(
    "zoom",
    `https://api.zoom.us/v2/users/${encodeURIComponent(credentials.hostUserId)}/meetings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: "פגישת מיקוד – SYSTEMIZE",
        type: 2,
        start_time: startsAt.toISOString(),
        duration: durationMinutes,
        timezone: "UTC",
        agenda: marker,
        settings: {
          approval_type: 2,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
        },
      }),
    }
  );
  if (!response.ok) throw await zoomResponseError("create", response);
  const parsed = meetingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "zoom_create_response_invalid");
  }
  return {
    meetingId: String(parsed.data.id),
    joinUrl: parsed.data.join_url,
  };
}
