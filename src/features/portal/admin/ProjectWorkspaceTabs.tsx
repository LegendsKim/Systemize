import Link from "next/link";
import {
  adminProjectTabHref,
  adminProjectTabs,
  type AdminProjectTab,
} from "./project-tabs";

interface ProjectWorkspaceTabsProps {
  readonly projectId: string;
  readonly activeTab: AdminProjectTab;
}

export function ProjectWorkspaceTabs({
  projectId,
  activeTab,
}: ProjectWorkspaceTabsProps) {
  return (
    <nav className="admin-project-tabs" aria-label="אזורי הפרויקט">
      {adminProjectTabs.map((tab) => (
        <Link
          key={tab.id}
          href={adminProjectTabHref(projectId, tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
