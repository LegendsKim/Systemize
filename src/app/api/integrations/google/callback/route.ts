import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPortalIdentity } from "@/features/portal/auth/session";
import { getSystemizeOwnerGmail } from "@/lib/env/server";
import { siteUrl } from "@/lib/site-config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  exchangeGoogleCalendarCode,
  getAuthorizedGoogleEmail,
} from "@/server/meetings/google-oauth";
import { scheduleMeetingIntegrationDrain } from "@/server/meetings/schedule";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const stateCookie = "systemize_google_calendar_state";

function sameState(expected: string, actual: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  return (
    expectedBytes.length === actualBytes.length &&
    timingSafeEqual(expectedBytes, actualBytes)
  );
}

function redirectWithNotice(notice: string): Response {
  return Response.redirect(
    new URL(`/admin/settings?notice=${encodeURIComponent(notice)}`, siteUrl),
    303
  );
}

export async function GET(request: Request): Promise<Response> {
  const identity = await getPortalIdentity();
  if (!identity || identity.appRole !== "systemize_owner") {
    return redirectWithNotice("google-calendar-forbidden");
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(stateCookie)?.value ?? "";
  cookieStore.delete(stateCookie);
  if (
    !code ||
    code.length > 2048 ||
    !state ||
    state.length > 200 ||
    !expectedState ||
    !sameState(expectedState, state)
  ) {
    return redirectWithNotice("google-calendar-state-invalid");
  }

  try {
    const redirectUri = new URL(
      "/api/integrations/google/callback",
      siteUrl
    ).toString();
    const authorization = await exchangeGoogleCalendarCode({ code, redirectUri });
    const connectedEmail = await getAuthorizedGoogleEmail(
      authorization.accessToken
    );
    if (connectedEmail !== getSystemizeOwnerGmail()) {
      return redirectWithNotice("google-calendar-account-mismatch");
    }
    const admin = getAdminSupabaseClient();
    const { error } = await admin.rpc("store_google_calendar_connection", {
      p_refresh_token: authorization.refreshToken,
      p_connected_by: identity.userId,
      p_connected_email: connectedEmail,
      p_granted_scopes: [...authorization.scopes],
    });
    if (error) {
      return redirectWithNotice("google-calendar-store-failed");
    }
    scheduleMeetingIntegrationDrain();
    return redirectWithNotice("google-calendar-connected");
  } catch {
    return redirectWithNotice("google-calendar-connect-failed");
  }
}
