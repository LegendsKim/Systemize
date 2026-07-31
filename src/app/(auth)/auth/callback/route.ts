import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { invitationCookieName } from "@/features/portal/auth/constants";
import { canResumeClientSession } from "@/features/portal/auth/returning-client";
import {
  isAllowedGmailAddress,
  normalizeGmailAddress,
} from "@/features/portal/invitations/email";
import {
  hashInvitationToken,
  isInvitationToken,
} from "@/features/portal/invitations/tokens";
import { getSystemizeOwnerGmail } from "@/lib/env/server";
import { siteUrl } from "@/lib/site-config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/*
 * Redirects are built against the configured site URL rather than `request.url`.
 *
 * Behind a platform proxy `request.url` carries the internal origin, and a redirect to a
 * different origin than the one the browser is on is treated as cross-site: `SameSite=Lax`
 * session cookies are not sent on the next request, and the freshly signed-in visitor
 * arrives at the portal looking anonymous. Anchoring to the canonical origin keeps the
 * whole hop same-site.
 */
function redirectWithClearedInvitation(pathname: string): NextResponse {
  const response = NextResponse.redirect(new URL(pathname, siteUrl));
  response.cookies.delete(invitationCookieName);
  return response;
}

/**
 * Abandons the sign-in with a named reason.
 *
 * The reason is logged because this route is the one place a user can be turned away
 * with no way to explain why, and "it said I do not exist" is not a diagnosis. Only the
 * reason is recorded: no address, no identifier, no token.
 */
function failed(reason: string): NextResponse {
  console.warn(`auth_callback_rejected reason=${reason}`);
  return redirectWithClearedInvitation(`/auth/error?reason=${reason}`);
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return failed("missing_code");
  }

  const supabase = await createServerSupabaseClient();
  const exchange = await supabase.auth.exchangeCodeForSession(code);
  if (exchange.error) {
    return failed("session_exchange");
  }

  /*
   * The user comes from the exchange result, not from a second `getUser()` call.
   *
   * `getUser()` re-reads the access token out of the cookie store this very request has
   * only just written to, then asks the auth server about it. That is one avoidable round
   * trip and one avoidable race on a browser's first sign-in, where those cookies did not
   * exist a moment ago — and when it loses, a legitimate owner is told their account is
   * unknown and has to sign in a second time. The exchange already returned a verified
   * user; asking again gains nothing.
   */
  const user = exchange.data.user;

  const isGoogleIdentity = user?.identities?.some(
    (identity) => identity.provider === "google"
  );
  if (
    !user?.email ||
    !user.email_confirmed_at ||
    !isGoogleIdentity ||
    !isAllowedGmailAddress(user.email)
  ) {
    await supabase.auth.signOut();
    return failed("gmail_required");
  }

  const email = normalizeGmailAddress(user.email);
  const cookieStore = await cookies();
  const rawInvitationToken = cookieStore.get(invitationCookieName)?.value;
  const admin = getAdminSupabaseClient();

  if (email === getSystemizeOwnerGmail()) {
    const fullName =
      typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name.trim().slice(0, 120)
        : "Marlen Kimiagrov";

    /*
     * Conflict resolution is on `email`, not on `id`.
     *
     * `profiles.email` is unique. Keying the upsert on `id` means that if a row already
     * holds the owner's address under an older auth user — which is what a re-created
     * Supabase project, a wiped auth table, or a re-linked Google identity leaves behind
     * — the insert collides on the email constraint and every single sign-in fails at
     * `profile_setup`. Resolving on the address instead adopts that row and moves it to
     * the current identity, which is the intended outcome: one owner, one address.
     */
    const { error } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName.length >= 2 ? fullName : "Marlen Kimiagrov",
          app_role: "systemize_owner",
        },
        { onConflict: "email" }
      );

    if (error) {
      await supabase.auth.signOut();
      return failed("profile_setup");
    }

    /*
     * The role is confirmed through the visitor's own session before they are sent to the
     * console. Writing with the service-role client proves the row exists; it does not
     * prove this browser can read it back, and `/admin` answers that question by bouncing
     * anyone it cannot verify. Establishing it here means the redirect is only issued once
     * the console is certain to admit them.
     */
    const { data: profile } = await supabase
      .from("profiles")
      .select("app_role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.app_role !== "systemize_owner") {
      await supabase.auth.signOut({ scope: "local" });
      return failed("profile_setup");
    }

    return redirectWithClearedInvitation("/admin");
  }

  /*
   * An invitation proves the first admission; it is not a reusable login credential.
   * Returning clients are admitted from durable account state instead: the verified
   * Google address must still match their profile and they must still have an active
   * project membership. Revoking that membership therefore closes future sessions even
   * if the person previously accepted an invitation.
   */
  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("email,app_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    await supabase.auth.signOut();
    return failed("profile_lookup");
  }

  if (existingProfile?.app_role === "client") {
    const { count: activeMemberships, error: membershipLookupError } =
      await admin
        .from("project_memberships")
        .select("project_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

    if (membershipLookupError) {
      await supabase.auth.signOut();
      return failed("membership_lookup");
    }

    if (
      canResumeClientSession({
        profileEmail: existingProfile.email,
        appRole: existingProfile.app_role,
        hasActiveMembership: (activeMemberships ?? 0) > 0,
        verifiedEmail: email,
      })
    ) {
      return redirectWithClearedInvitation("/portal");
    }
  }

  if (!rawInvitationToken || !isInvitationToken(rawInvitationToken)) {
    await supabase.auth.signOut();
    return failed("invitation_required");
  }

  const { error: acceptanceError } = await admin.rpc(
    "accept_project_invitation",
    {
      p_token_hash: hashInvitationToken(rawInvitationToken),
      p_user_id: user.id,
      p_verified_email: email,
    }
  );

  if (acceptanceError) {
    await supabase.auth.signOut();
    return failed("invitation_rejected");
  }

  // `welcome=1` is the one signal the portal has that this render is an arrival rather
  // than a navigation, and it is what lets the boot overlay be part of the very first
  // HTML instead of appearing after hydration. The overlay strips the parameter itself
  // once it has played, so a refresh does not repeat it.
  return redirectWithClearedInvitation("/portal?welcome=1");
}
