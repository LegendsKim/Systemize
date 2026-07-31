import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getPortalIdentity } from "@/features/portal/auth/session";
import { siteUrl } from "@/lib/site-config";
import { buildGoogleCalendarAuthorizationUrl } from "@/server/meetings/google-oauth";

export const dynamic = "force-dynamic";

const stateCookie = "systemize_google_calendar_state";

export async function GET(): Promise<Response> {
  const identity = await getPortalIdentity();
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  if (!identity) {
    return Response.redirect(new URL("/login", siteUrl), 303);
  }
  if (identity.appRole !== "systemize_owner") {
    return Response.json({ error: "forbidden" }, { status: 403, headers });
  }

  const state = randomBytes(32).toString("base64url");
  const redirectUri = new URL(
    "/api/integrations/google/callback",
    siteUrl
  ).toString();
  const authorizationUrl = buildGoogleCalendarAuthorizationUrl({
    redirectUri,
    state,
    loginHint: identity.email,
  });
  const cookieStore = await cookies();
  cookieStore.set(stateCookie, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/integrations/google/callback",
    maxAge: 10 * 60,
  });
  return Response.redirect(authorizationUrl, 303);
}
