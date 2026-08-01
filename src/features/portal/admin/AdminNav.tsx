"use client";
// Required: the current-page state depends on the active route, and a Server Component
// layout has no access to the pathname.

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentAdminRoute } from "@/features/portal/admin/nav-state";
import { projectStageLabels } from "@/features/portal/project-stage";
import type { ProjectStage } from "@/lib/supabase/types";

interface AdminNavProject {
  readonly id: string;
  readonly name: string;
  readonly stage: ProjectStage;
}

interface AdminNavProps {
  /** Unopened notifications. Rendered as a count only when there are any. */
  readonly unreadCount: number;
  /** Active work only; completed and cancelled projects remain in the directory. */
  readonly projects: readonly AdminNavProject[];
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
  settings:
    "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.2 3.5 1.3 1-.9 2.2-1.7-.2a7 7 0 0 1-1.3 1.3l.2 1.7-2.2.9-1-1.3a7 7 0 0 1-1.8 0l-1 1.3-2.2-.9.2-1.7A7 7 0 0 1 7.5 15l-1.7.2-.9-2.2 1.3-1a7 7 0 0 1 0-1.8l-1.3-1 .9-2.2 1.7.2a7 7 0 0 1 1.3-1.3l-.2-1.7 2.2-.9 1 1.3a7 7 0 0 1 1.8 0l1-1.3 2.2.9-.2 1.7a7 7 0 0 1 1.3 1.3l1.7-.2.9 2.2-1.3 1a7 7 0 0 1 0 1.8Z",
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
const operationsGroup = {
  label: "תפעול",
  items: [
    { href: "/admin", label: "סקירה", icon: "overview" },
    { href: "/admin/leads", label: "לידים", icon: "leads" },
    { href: "/admin/companies", label: "חברות", icon: "companies" },
  ],
} as const;

const systemGroup = {
  label: "מערכת",
  items: [
    { href: "/admin/settings", label: "הגדרות", icon: "settings" },
    { href: "/admin/templates", label: "תבניות", icon: "templates" },
  ],
} as const;

const primaryNavItems = [...operationsGroup.items, ...systemGroup.items] as const;

export function AdminNav({ unreadCount, projects }: AdminNavProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
      return;
    }
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    const previousOverflow = document.body.style.overflow;
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu();
    };

    dialog.showModal();
    document.body.style.overflow = "hidden";
    desktopQuery.addEventListener("change", handleDesktopChange);

    return () => {
      desktopQuery.removeEventListener("change", handleDesktopChange);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [closeMenu, menuOpen]);

  const currentProject = projects.find((project) =>
    isCurrentAdminRoute(pathname, `/admin/projects/${project.id}`)
  );
  const currentItem = primaryNavItems.find((item) =>
    isCurrentAdminRoute(pathname, item.href)
  );
  const currentLabel = currentProject
    ? `פרויקט · ${currentProject.name}`
    : pathname.startsWith("/admin/projects")
      ? "פרויקטים"
      : (currentItem?.label ?? "ניהול");

  return (
    <>
      <div className="admin-mobile-nav-bar">
        <button
          type="button"
          className="admin-nav-trigger"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="admin-nav-trigger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          תפריט
        </button>
        <span className="admin-mobile-nav-current">{currentLabel}</span>
      </div>

      <AdminNavLinks
        className="admin-nav admin-nav-desktop"
        pathname={pathname}
        unreadCount={unreadCount}
        projects={projects}
      />

      {menuOpen ? (
        <dialog
          ref={dialogRef}
          className="admin-nav-dialog"
          aria-labelledby="admin-nav-dialog-title"
          onClose={() => setMenuOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <div className="admin-nav-drawer">
            <header className="admin-nav-drawer-head">
              <div>
                <span>סביבת הניהול</span>
                <strong id="admin-nav-dialog-title">מעבר בין אזורים</strong>
              </div>
              <button
                type="button"
                className="admin-nav-drawer-close"
                aria-label="סגירת התפריט"
                autoFocus
                onClick={closeMenu}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </header>
            <AdminNavLinks
              className="admin-nav admin-nav-drawer-list"
              pathname={pathname}
              unreadCount={unreadCount}
              projects={projects}
              onNavigate={closeMenu}
            />
          </div>
        </dialog>
      ) : null}
    </>
  );
}

function AdminNavLinks({
  className,
  pathname,
  unreadCount,
  projects,
  onNavigate,
}: {
  readonly className: string;
  readonly pathname: string;
  readonly unreadCount: number;
  readonly projects: readonly AdminNavProject[];
  readonly onNavigate?: () => void;
}) {
  return (
    <nav className={className} aria-label="ניווט סביבת הניהול">
      <Fragment>
        <span className="admin-nav-group-label" aria-hidden="true">
          {operationsGroup.label}
        </span>
        {operationsGroup.items.map((item) => (
          <AdminNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            unreadCount={unreadCount}
            onNavigate={onNavigate}
          />
        ))}

        <span className="admin-nav-group-label admin-nav-projects-label">פרויקטים</span>
        <div className="admin-nav-project-list">
          {projects.length === 0 ? (
            <span className="admin-nav-project-empty">אין פרויקטים פעילים</span>
          ) : (
            projects.map((project) => {
              const href = `/admin/projects/${project.id}`;
              return (
                <Link
                  key={project.id}
                  href={href}
                  className="admin-nav-project"
                  aria-label={`${project.name}, ${projectStageLabels[project.stage]}`}
                  aria-current={isCurrentAdminRoute(pathname, href) ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <span className="admin-nav-project-marker" aria-hidden="true" />
                  <span className="admin-nav-project-copy">
                    <strong>{project.name}</strong>
                    <small>{projectStageLabels[project.stage]}</small>
                  </span>
                </Link>
              );
            })
          )}
        </div>

        <span className="admin-nav-group-label" aria-hidden="true">
          {systemGroup.label}
        </span>
        {systemGroup.items.map((item) => (
          <AdminNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            unreadCount={unreadCount}
            onNavigate={onNavigate}
          />
        ))}
      </Fragment>
    </nav>
  );
}

function AdminNavLink({
  item,
  pathname,
  unreadCount,
  onNavigate,
}: {
  readonly item: NavItem;
  readonly pathname: string;
  readonly unreadCount: number;
  readonly onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isCurrentAdminRoute(pathname, item.href) ? "page" : undefined}
      onClick={onNavigate}
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
      {item.icon === "settings" && unreadCount > 0 && (
        <span className="admin-nav-count">
          {unreadCount > 9 ? "9+" : unreadCount}
          <span className="admin-sr-only"> התראות שלא נקראו</span>
        </span>
      )}
    </Link>
  );
}
