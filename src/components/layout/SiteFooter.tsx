import Link from "next/link";
import { SystemizeMark } from "@/components/brand/SystemizeMark";
import { CookieSettingsLink } from "@/features/cookies/components/CookieSettingsLink";
import { contact, legalRoutes, navigation, siteName, siteTagline } from "@/lib/site-config";

interface SiteFooterProps {
  /**
   * Passed in rather than read from the clock inside the component: a value derived from
   * `Date` during render would differ between the server and client HTML.
   */
  readonly year: number;
}

/**
 * Site footer.
 *
 * Three labelled columns — brand and contact, page navigation, legal — over a baseline
 * row. The previous single row put the wordmark, three legal links and a copyright line
 * on one axis, which gave a visitor looking for a phone number nowhere to look.
 *
 * The two `<nav>` elements carry distinct `aria-label`s: a screen reader lists landmarks
 * by name, and two unnamed navigations in one footer are indistinguishable.
 */
export function SiteFooter({ year }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          {/* Latin, left-to-right lockup: mark, then name. Matches the header. */}
          <Link href="/" className="site-footer-lockup" dir="ltr" aria-label={`${siteName}, חזרה לדף הבית`}>
            <SystemizeMark className="site-footer-mark" />
            <span className="site-footer-name">{siteName}</span>
          </Link>

          <p className="site-footer-tagline">{siteTagline}</p>

          <div className="site-footer-contact">
            {/* `dir="ltr"`: a phone number is a Latin-digit run, and in an RTL paragraph
                the leading zero would otherwise be reordered to the end. */}
            <a className="site-footer-phone" href={`tel:${contact.tel}`} dir="ltr">
              {contact.display}
            </a>
            <a
              className="site-footer-whatsapp"
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ווטסאפ
            </a>
          </div>
        </div>

        <nav className="site-footer-column" aria-label="ניווט בעמוד">
          <h2 className="site-footer-heading">באתר</h2>
          <ul className="site-footer-links">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="site-footer-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer-column" aria-label="ניווט משפטי">
          <h2 className="site-footer-heading">מידע משפטי</h2>
          <ul className="site-footer-links">
            {legalRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} className="site-footer-link">
                  {route.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer-baseline">
        <p className="site-footer-copy">
          © {year} {siteName}. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
