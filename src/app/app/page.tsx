import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalIdentity } from "@/features/portal/auth/session";

export const metadata: Metadata = {
  title: "פתיחת SYSTEMIZE",
  robots: { index: false, follow: false, noarchive: true },
};

export const dynamic = "force-dynamic";

export default async function InstalledAppEntryPage(): Promise<never> {
  const identity = await getPortalIdentity();
  if (!identity) {
    redirect("/login");
  }
  redirect(identity.appRole === "systemize_owner" ? "/admin" : "/portal");
}
