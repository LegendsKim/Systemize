import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requirePortalIdentity } from "@/features/portal/auth/session";
import { PortalNav } from "@/features/portal/components/PortalNav";
import { PwaRegistration } from "@/features/portal/pwa/PwaRegistration";
import { PwaSignOutForm } from "@/features/portal/pwa/PwaSignOutForm";
import { portalShareMetadata } from "@/lib/seo/portal-share-metadata";

export const metadata: Metadata = portalShareMetadata({
  path: "/portal",
  title: "האזור האישי",
  description:
    "מרחב הפרויקט המאובטח של SYSTEMIZE — מצב נוכחי, פעולות, מסמכים ועדכונים.",
});

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await requirePortalIdentity();

  return (
    <div className="portal-shell">
      <PwaRegistration />
      <header className="portal-topbar">
        <Link href="/portal" className="portal-brand" aria-label="SYSTEMIZE PORTAL">
          <Image src="/icon.svg" width={34} height={34} alt="" aria-hidden="true" />
          <span>
            <b dir="ltr">SYSTEMIZE</b>
            <small>האזור האישי</small>
          </span>
        </Link>
        <PortalNav variant="desktop" />
        <div className="portal-account">
          <span className="portal-account-avatar" aria-hidden="true">
            {identity.fullName.trim().charAt(0)}
          </span>
          <span className="portal-account-name">{identity.fullName}</span>
          <PwaSignOutForm buttonClassName="portal-text-action" />
        </div>
      </header>
      <div className="portal-content">{children}</div>
      <PortalNav variant="mobile" />
    </div>
  );
}
