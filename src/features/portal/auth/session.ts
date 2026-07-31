import "server-only";
import { redirect } from "next/navigation";
import type { PortalAppRole } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface PortalIdentity {
  readonly userId: string;
  readonly email: string;
  readonly fullName: string;
  readonly appRole: PortalAppRole;
}

export async function getPortalIdentity(): Promise<PortalIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,app_role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    appRole: profile.app_role,
  };
}

export async function requirePortalIdentity(): Promise<PortalIdentity> {
  const identity = await getPortalIdentity();
  if (!identity) {
    redirect("/login");
  }
  return identity;
}

export async function requireSystemizeOwner(): Promise<PortalIdentity> {
  const identity = await requirePortalIdentity();
  if (identity.appRole !== "systemize_owner") {
    redirect("/portal");
  }
  return identity;
}
