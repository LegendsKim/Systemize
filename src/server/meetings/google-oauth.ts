import "server-only";
import { z } from "zod";
import {
  getGoogleCalendarClientCredentials,
  type GoogleCalendarClientCredentials,
} from "@/lib/env/server";
import { googleCalendarScope } from "./google-calendar-provider";
import {
  classifyProviderStatus,
  MeetingProviderError,
  providerFetch,
} from "./provider-error";

const tokenSchema = z.object({
  access_token: z.string().min(20).max(4096),
  refresh_token: z.string().min(20).max(2048),
  scope: z.string().min(3).max(2000),
});

const userInfoSchema = z.object({
  email: z.string().email().max(320),
  email_verified: z.boolean(),
});

export interface GoogleCalendarAuthorization {
  readonly refreshToken: string;
  readonly accessToken: string;
  readonly scopes: readonly string[];
}

export function buildGoogleCalendarAuthorizationUrl(input: {
  readonly redirectUri: string;
  readonly state: string;
  readonly loginHint: string;
  readonly credentials?: GoogleCalendarClientCredentials | null;
}): string {
  const credentials =
    input.credentials === undefined
      ? getGoogleCalendarClientCredentials()
      : input.credentials;
  if (!credentials) {
    throw new MeetingProviderError("configuration", "google_not_configured");
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("scope", `openid email ${googleCalendarScope}`);
  url.searchParams.set("state", input.state);
  url.searchParams.set("login_hint", input.loginHint);
  return url.toString();
}

export async function exchangeGoogleCalendarCode(input: {
  readonly code: string;
  readonly redirectUri: string;
  readonly credentials?: GoogleCalendarClientCredentials | null;
}): Promise<GoogleCalendarAuthorization> {
  const credentials =
    input.credentials === undefined
      ? getGoogleCalendarClientCredentials()
      : input.credentials;
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
        code: input.code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
      }),
    }
  );
  if (!response.ok) throw classifyProviderStatus("google", response);
  const parsed = tokenSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new MeetingProviderError("permanent", "google_authorization_invalid");
  }
  return {
    refreshToken: parsed.data.refresh_token,
    accessToken: parsed.data.access_token,
    scopes: parsed.data.scope.split(/\s+/).filter(Boolean).slice(0, 10),
  };
}

export async function getAuthorizedGoogleEmail(
  accessToken: string
): Promise<string> {
  const response = await providerFetch(
    "google",
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) throw classifyProviderStatus("google", response);
  const parsed = userInfoSchema.safeParse(await response.json());
  if (
    !parsed.success ||
    !parsed.data.email_verified ||
    !parsed.data.email.toLowerCase().endsWith("@gmail.com")
  ) {
    throw new MeetingProviderError("invalid_request", "google_email_invalid");
  }
  return parsed.data.email.toLowerCase();
}
