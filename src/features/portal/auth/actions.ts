"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { invitationCookieName } from "@/features/portal/auth/constants";
import { siteUrl } from "@/lib/site-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isInvitationToken } from "@/features/portal/invitations/tokens";

export async function beginGoogleSignIn(formData: FormData): Promise<void> {
  const invitationToken = formData.get("invitationToken");
  const cookieStore = await cookies();

  if (typeof invitationToken === "string" && invitationToken.length > 0) {
    if (!isInvitationToken(invitationToken)) {
      redirect("/auth/error?reason=invalid_invitation");
    }

    cookieStore.set(invitationCookieName, invitationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
  } else {
    cookieStore.delete(invitationCookieName);
  }

  const supabase = await createServerSupabaseClient();
  const redirectTo = new URL("/auth/callback", siteUrl).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "openid email profile",
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/auth/error?reason=provider_unavailable");
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id);
    if (subscriptionError) {
      console.warn("push_subscription_cleanup_failed reason=database_error");
    }
  }

  // `scope: "global"` revokes the refresh token at the auth server, not merely the copy
  // in this browser. On a shared or handed-over device, clearing only the local cookie
  // leaves a token that is still valid everywhere it was ever synced.
  await supabase.auth.signOut({ scope: "global" });

  // Any half-finished invitation belongs to the account that just left.
  const cookieStore = await cookies();
  cookieStore.delete(invitationCookieName);

  redirect("/");
}
