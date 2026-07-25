import Link from "next/link";
import { legalRoutes, siteCoordinates, siteName } from "@/lib/site-config";

interface SiteFooterProps {
  /**
   * Passed in rather than read from the clock inside the component: a value derived from
   * `Date` during render would differ between the server and client HTML.
   */
  readonly year: number;
}

export function SiteFooter({ year }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <p className="site-footer-name">{siteName}</p>
          <p className="site-footer-coords">{siteCoordinates}</p>
        </div>

        <nav aria-label="ניווט משפטי">
          <ul className="site-footer-links">
            {legalRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} className="site-footer-link">
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="site-footer-copy">
          © {year} {siteName}. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
