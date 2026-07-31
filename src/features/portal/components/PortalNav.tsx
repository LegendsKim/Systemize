"use client";
// Required: the current-page state depends on the active route, and a Server Component
// layout has no access to the pathname.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isCurrentPortalRoute,
  portalNavItems,
  portalSecondaryNavItems,
} from "@/features/portal/portal-nav-state";

interface PortalNavProps {
  /** The top bar carries settings too; the bottom bar keeps to five destinations. */
  readonly variant: "desktop" | "mobile";
}

export function PortalNav({ variant }: PortalNavProps) {
  const pathname = usePathname();
  const items =
    variant === "desktop"
      ? [...portalNavItems, ...portalSecondaryNavItems]
      : portalNavItems;

  return (
    <nav
      className={
        variant === "desktop" ? "portal-desktop-nav" : "portal-mobile-nav"
      }
      aria-label="ניווט באזור האישי"
    >
      {items.map((item) => {
        const current = isCurrentPortalRoute(pathname, item.match);

        return (
          <Link
            key={item.href}
            href={item.href}
            /*
             * `aria-current` is the state; the styling hangs off it rather than off a
             * second class. One source of truth means the highlight a sighted user sees
             * and the position a screen reader announces cannot disagree.
             */
            aria-current={current ? "page" : undefined}
            className={
              item.primary && variant === "mobile"
                ? "portal-mobile-nav-primary"
                : undefined
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
