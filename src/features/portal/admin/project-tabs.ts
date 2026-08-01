export const adminProjectTabs = [
  { id: "overview", label: "סקירה" },
  { id: "client", label: "לקוח וגישה" },
  { id: "discovery", label: "אפיון" },
  { id: "documents", label: "מסמכים" },
  { id: "commercial", label: "מסחרי" },
  { id: "activity", label: "פעילות" },
] as const;

export type AdminProjectTab = (typeof adminProjectTabs)[number]["id"];

export function resolveAdminProjectTab(value: string | undefined): AdminProjectTab {
  return adminProjectTabs.some((tab) => tab.id === value)
    ? (value as AdminProjectTab)
    : "overview";
}

export function adminProjectTabHref(
  projectId: string,
  tab: AdminProjectTab
): string {
  return `/admin/projects/${projectId}?tab=${tab}`;
}
