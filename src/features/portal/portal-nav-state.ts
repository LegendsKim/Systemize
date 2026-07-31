/**
 * Which portal destination the current pathname belongs to.
 *
 * The active item is decided from the pathname alone, never from what was tapped last.
 * That distinction is the whole bug this module exists to fix: state held in the
 * component survives neither a refresh nor an app-shortcut cold start, and a highlight
 * that is wrong after a reload is worse than no highlight at all.
 *
 * Matching is declared per destination rather than derived from the href, because two of
 * the five do not match their own href: "פרויקט" links to the list on the home screen
 * but belongs to every `/portal/projects/...` screen, and "בית" is the parent of all of
 * them so a prefix test would light it up everywhere.
 */

export interface PortalNavItem {
  readonly href: string;
  readonly label: string;
  /** Pathnames owned by this destination. `exact` matches only itself. */
  readonly match: { readonly exact: string } | { readonly prefix: string };
}

export const portalNavItems: readonly PortalNavItem[] = [
  { href: "/portal", label: "בית", match: { exact: "/portal" } },
  {
    href: "/portal#projects",
    label: "פרויקט",
    match: { prefix: "/portal/projects" },
  },
  {
    href: "/portal/actions",
    label: "פעולות",
    match: { prefix: "/portal/actions" },
  },
  {
    href: "/portal/documents",
    label: "מסמכים",
    match: { prefix: "/portal/documents" },
  },
  {
    href: "/portal/notifications",
    label: "עדכונים",
    match: { prefix: "/portal/notifications" },
  },
];

/** The settings screen has no tab of its own; it is reached from the account menu. */
export const portalSecondaryNavItems: readonly PortalNavItem[] = [
  {
    href: "/portal/settings",
    label: "הגדרות",
    match: { prefix: "/portal/settings" },
  },
];

export function isCurrentPortalRoute(
  pathname: string,
  match: PortalNavItem["match"]
): boolean {
  // A trailing slash is the same screen. `/portal/` must not read as "not home".
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  if ("exact" in match) {
    return normalized === match.exact;
  }
  return (
    normalized === match.prefix || normalized.startsWith(`${match.prefix}/`)
  );
}
