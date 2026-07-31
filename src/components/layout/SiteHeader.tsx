import Link from "next/link";
import { SystemizeMark } from "@/components/brand/SystemizeMark";
import { primaryNavigation, siteName } from "@/lib/site-config";

/**
 * Site header.
 *
 * The wordmark sits at the visual left and the navigation at the visual right, matching
 * the approved design. That arrangement comes from element order inside a `space-between`
 * row, never from a physical `left`/`right` offset, so it stays correct under RTL.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <nav aria-label="ניווט ראשי" className="site-nav">
          <ul className="site-nav-list">
            {primaryNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* The lockup is a Latin, left-to-right run: mark, then name. */}
        <Link
          href="/"
          className="site-wordmark"
          dir="ltr"
          aria-label={`${siteName}, חזרה לדף הבית`}
        >
          <SystemizeMark className="site-wordmark-mark" />
          <span className="site-wordmark-name">{siteName}</span>
        </Link>
      </div>
    </header>
  );
}
