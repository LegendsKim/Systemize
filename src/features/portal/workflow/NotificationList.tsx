import { openNotification } from "./actions";
import { formatPortalDateTime } from "./format";

interface NotificationItem {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly read_at: string | null;
  readonly created_at: string;
}
export function NotificationList({
  notifications,
}: {
  readonly notifications: readonly NotificationItem[];
}) {
  if (notifications.length === 0) {
    return (
      <section className="portal-empty-state">
        <h2>הכול מעודכן</h2>
        <p>כשתישמר פעולה חשובה בפרויקט, היא תופיע כאן.</p>
      </section>
    );
  }

  return (
    <ul className="workflow-notification-list">
      {notifications.map((notification) => (
        <li key={notification.id} data-read={Boolean(notification.read_at)}>
          <div>
            <span>{notification.read_at ? "נקרא" : "חדש"}</span>
            <strong>{notification.title}</strong>
            <p>{notification.body}</p>
            <small>{formatPortalDateTime(notification.created_at)}</small>
          </div>
          <form action={openNotification}>
            <input
              type="hidden"
              name="notificationId"
              value={notification.id}
            />
            <input type="hidden" name="href" value={notification.href} />
            <button type="submit" className="portal-secondary-button">
              פתיחת הפרויקט
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
