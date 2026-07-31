export const systemHealthComponents = [
  "database",
  "zoom",
  "google_calendar",
  "push_notifications",
  "meeting_automation",
] as const;

const maximumHealthSnapshotAgeMs = 26 * 60 * 60 * 1_000;

export type SystemHealthComponent = (typeof systemHealthComponents)[number];
export type SystemHealthStatus = "healthy" | "unhealthy" | "unknown";

export interface SystemHealthCheckView {
  readonly component: SystemHealthComponent;
  readonly status: SystemHealthStatus;
  readonly errorCode: string | null;
  readonly checkedAt: string | null;
  readonly statusChangedAt: string | null;
}

export interface SystemHealthSnapshot {
  readonly overall: SystemHealthStatus;
  readonly checks: readonly SystemHealthCheckView[];
}

export const systemHealthLabels: Record<SystemHealthComponent, string> = {
  database: "מסד הנתונים",
  zoom: "Zoom",
  google_calendar: "Google Calendar",
  push_notifications: "התראות Push",
  meeting_automation: "אוטומציית פגישות",
};

export function buildSystemHealthSnapshot(
  rows: readonly {
    readonly component: string;
    readonly status: string;
    readonly error_code: string | null;
    readonly checked_at: string;
    readonly status_changed_at: string;
  }[],
  now: Date
): SystemHealthSnapshot {
  const byComponent = new Map(rows.map((row) => [row.component, row]));
  const checks = systemHealthComponents.map((component): SystemHealthCheckView => {
    const row = byComponent.get(component);
    const checkedAtMs = row ? Date.parse(row.checked_at) : Number.NaN;
    const stale =
      !Number.isFinite(checkedAtMs) ||
      now.getTime() - checkedAtMs > maximumHealthSnapshotAgeMs;
    if (
      !row ||
      stale ||
      (row.status !== "healthy" && row.status !== "unhealthy")
    ) {
      return {
        component,
        status: "unknown",
        errorCode: null,
        checkedAt: null,
        statusChangedAt: null,
      };
    }
    return {
      component,
      status: row.status,
      errorCode: row.error_code,
      checkedAt: row.checked_at,
      statusChangedAt: row.status_changed_at,
    };
  });
  const overall = checks.some((check) => check.status === "unhealthy")
    ? "unhealthy"
    : checks.some((check) => check.status === "unknown")
      ? "unknown"
      : "healthy";
  return { overall, checks };
}

export function describeSystemHealthFailure(
  component: SystemHealthComponent,
  errorCode: string | null
): string {
  if (component === "push_notifications" && errorCode === "push_owner_device_missing") {
    return "לא נמצא מכשיר מנהל שמקבל התראות Push.";
  }
  if (component === "google_calendar" && errorCode === "google_not_connected") {
    return "Google Calendar אינו מחובר לחשבון הבעלים.";
  }
  if (component === "google_calendar" && errorCode === "google_reconnect_required") {
    return "ההרשאה של Google Calendar פגה ונדרש חיבור מחדש.";
  }
  if (component === "meeting_automation" && errorCode === "meeting_attention_required") {
    return "יש פגישה שיצירת ה־Zoom או הזימון שלה לא הושלמה.";
  }
  const defaults: Record<SystemHealthComponent, string> = {
    database: "הגישה למסד הנתונים נכשלה.",
    zoom: "בדיקת החיבור ל־Zoom נכשלה.",
    google_calendar: "בדיקת החיבור ל־Google Calendar נכשלה.",
    push_notifications: "מערכת התראות ה־Push אינה מוכנה.",
    meeting_automation: "אוטומציית הפגישות דורשת בדיקה.",
  };
  return defaults[component];
}
