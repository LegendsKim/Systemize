import type { Metadata } from "next";
import Link from "next/link";
import { SystemizeLockup } from "@/components/brand/SystemizeLockup";
import { AdminNav } from "@/features/portal/admin/AdminNav";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { countUnreadNotifications } from "@/server/repositories/workflow.repository";
import { PwaRegistration } from "@/features/portal/pwa/PwaRegistration";
import { PwaSignOutForm } from "@/features/portal/pwa/PwaSignOutForm";

export const metadata: Metadata = {
  title: "ניהול SYSTEMIZE",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await requireSystemizeOwner();
  const supabase = await createServerSupabaseClient();
  const unreadCount = await countUnreadNotifications(supabase, identity.userId);

  const account = (
    <div className="admin-account">
      <span className="admin-account-avatar" aria-hidden="true">
        {identity.fullName.trim().charAt(0)}
      </span>
      <span className="admin-account-identity">
        <strong>{identity.fullName}</strong>
        <span>בעלים</span>
      </span>
    </div>
  );

  const signOutButton = (
    <PwaSignOutForm buttonClassName="admin-button" buttonVariant="ghost" />
  );

  return (
    <div className="admin-app">
      <PwaRegistration />
      {/*
        The rail is a vertical column on a desktop and a horizontal strip on a phone, from
        the same markup. No drawer and no overlay: a console that hides its navigation
        adds a tap to every single move an operator makes.
      */}
      <aside className="admin-rail" aria-label="ניווט וחשבון ניהול">
        <Link
          href="/admin"
          className="admin-rail-brand"
          aria-label="ניהול SYSTEMIZE, מסך הסקירה"
        >
          <SystemizeLockup />
          <span className="admin-rail-chip">ניהול</span>
        </Link>

        <AdminNav unreadCount={unreadCount} />

        <div className="admin-rail-account">
          {account}
          {signOutButton}
        </div>
      </aside>

      <div className="admin-content">
        {/* On a desktop the account lives in the rail's foot, so this bar carries only
            the sign-out; on a phone the rail has no foot and both appear here. */}
        <header className="admin-topbar">
          {account}
          {signOutButton}
        </header>
        {children}
      </div>
    </div>
  );
}
