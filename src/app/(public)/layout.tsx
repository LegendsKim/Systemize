import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
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

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter year={currentYear()} />
    </div>
  );
}
