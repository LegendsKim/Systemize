/**
 * Which admin destination the current pathname belongs to.
 *
 * Extracted from the navigation component because it is the one piece of that component
 * worth testing: the console's whole "where am I" affordance is this predicate, and its
 * only interesting case is the one that is easy to get wrong.
 */
export function isCurrentAdminRoute(pathname: string, href: string): boolean {
  /*
   * `/admin` is matched exactly. It is the parent of every other admin route, so a prefix
   * test would light up "סקירה" on all four pages — which is indistinguishable from having
   * no current-page state at all, the exact fault this exists to fix.
   */
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
