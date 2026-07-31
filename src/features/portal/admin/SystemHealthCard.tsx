import Link from "next/link";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import {
  describeSystemHealthFailure,
  systemHealthLabels,
  type SystemHealthSnapshot,
} from "@/server/system-health/system-health-model";

interface SystemHealthCardProps {
  readonly snapshot: SystemHealthSnapshot;
  readonly detailed?: boolean;
}

export function SystemHealthCard({
  snapshot,
  detailed = false,
}: SystemHealthCardProps) {
  const failed = snapshot.checks.filter((check) => check.status === "unhealthy");
  const unknown = snapshot.checks.filter((check) => check.status === "unknown");
  const title =
    snapshot.overall === "healthy"
      ? "כל המערכות עובדות"
      : snapshot.overall === "unhealthy"
        ? "מערכת אחת או יותר דורשת בדיקה"
        : "בדיקת המערכות טרם הושלמה";
  const description =
    snapshot.overall === "healthy"
      ? "החיבורים והאוטומציות המרכזיים עברו את הבדיקה האחרונה בהצלחה."
      : snapshot.overall === "unhealthy"
        ? failed
            .map((check) => systemHealthLabels[check.component])
            .join(" · ")
        : `${unknown.length} בדיקות עדיין ממתינות להרצה הראשונה.`;

  return (
    <section
      className="admin-system-health"
      data-status={snapshot.overall}
      aria-labelledby={detailed ? "settings-health-title" : "overview-health-title"}
    >
      <div className="admin-system-health-summary">
        <span className="admin-health-light" aria-hidden="true" />
        <div>
          <p className="admin-eyebrow">מצב המערכת</p>
          <h2 id={detailed ? "settings-health-title" : "overview-health-title"}>
            {title}
          </h2>
          <p>{description}</p>
        </div>
      </div>

      {detailed ? (
        <ul className="admin-health-list">
          {snapshot.checks.map((check) => (
            <li key={check.component} data-status={check.status}>
              <span className="admin-health-list-light" aria-hidden="true" />
              <span>
                <strong>{systemHealthLabels[check.component]}</strong>
                <small>
                  {check.status === "healthy"
                    ? "תקין"
                    : check.status === "unhealthy"
                      ? describeSystemHealthFailure(check.component, check.errorCode)
                      : "טרם נבדק"}
                  {check.checkedAt
                    ? ` · נבדק ${formatPortalDateTime(check.checkedAt)}`
                    : ""}
                </small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Link href="/admin/settings" className="admin-button" data-variant="secondary">
          פתיחת הגדרות ופרטים
        </Link>
      )}
    </section>
  );
}
