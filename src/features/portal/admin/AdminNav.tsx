"use client";
// Required: the current-page state depends on the active route, and a Server Component
// layout has no access to the pathname.

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentAdminRoute } from "@/features/portal/admin/nav-state";

interface AdminNavProps {
  /** Unopened notifications. Rendered as a count only when there are any. */
  readonly unreadCount: number;
}

/*
 * Monoline icons at the same weight as the brand mark, drawn on a 24-grid with a 1.75
 * stroke. Deliberately not an icon library: five glyphs is not a dependency, and a
 * borrowed set would sit at a different weight from the logo two centimetres above it.
 */
const icons = {
  overview: "M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z",
  leads:
    "M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Zm0.6-0.7 7.4 5.6 7.4-5.6",
  companies: "M4 20V7l7-3v16M11 20h9V10l-9-3M7.5 10.5v.01M7.5 14v.01M15 13v.01M15 16.5v.01",
  notifications:
    "M12 4a5 5 0 0 0-5 5v3.5L5.5 15h13L17 12.5V9a5 5 0 0 0-5-5Zm-2 14a2 2 0 0 0 4 0",
  templates:
    "M14 4H7a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-4Zm0 0v4h4M9 13h6M9 16.5h4",
} as const;

type NavKey = keyof typeof icons;

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: NavKey;
}

/*
 * Grouped as data rather than flagged while rendering. The obvious alternative — walking a
 * flat list and remembering the previous group — mutates during render, which React's
 * lint rules reject and a future concurrent render would break.
 */
const navGroups: readonly {
  readonly label: string;
  readonly items: readonly NavItem[];
}[] = [
  {
    label: "תפעול",
    items: [
      { href: "/admin", label: "סקירה", icon: "overview" },
      { href: "/admin/leads", label: "לידים", icon: "leads" },
      { href: "/admin/companies", label: "חברות", icon: "companies" },
    ],
  },
  {
    label: "מערכת",
    items: [
      { href: "/admin/notifications", label: "התראות", icon: "notifications" },
      { href: "/admin/templates", label: "תבניות", icon: "templates" },
    ],
  },
];

export function AdminNav({ unreadCount }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="ניווט סביבת הניהול">
      {navGroups.map((group) => (
        <Fragment key={group.label}>
          <span className="admin-nav-group-label" aria-hidden="true">
            {group.label}
          </span>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrentAdminRoute(pathname, item.href) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d={icons[item.icon]}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {item.label}
              {item.icon === "notifications" && unreadCount > 0 && (
                <span className="admin-nav-count">
                  {unreadCount > 9 ? "9+" : unreadCount}
                  <span className="admin-sr-only"> התראות שלא נקראו</span>
                </span>
              )}
            </Link>
          ))}
        </Fragment>
      ))}
    </nav>
  );
}
