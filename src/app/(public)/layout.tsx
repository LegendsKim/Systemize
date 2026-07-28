import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WhatsAppLauncher } from "@/components/layout/WhatsAppLauncher";
import { AccessibilityToolbar } from "@/features/accessibility/components/AccessibilityToolbar";
import { CookieConsent } from "@/features/cookies/components/CookieConsent";
import {
  COOKIE_CONSENT_NAME,
  parseCookiePreferences,
} from "@/features/cookies/cookie-preferences";
import { timeZone } from "@/lib/i18n";

/**
 * The copyright year is resolved once here, on the server, in the site's configured
 * timezone. Reading the clock inside the footer during render would risk a server and
 * client mismatch across a midnight boundary.
 */
function currentYear(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(new Date())
  );
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialCookiePreferences = parseCookiePreferences(
    cookieStore.get(COOKIE_CONSENT_NAME)?.value
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter year={currentYear()} />
      <WhatsAppLauncher />
      <AccessibilityToolbar />
      <CookieConsent initialPreferences={initialCookiePreferences} />
    </div>
  );
}
