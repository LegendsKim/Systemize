import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { NotificationList } from "@/features/portal/workflow/NotificationList";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUserNotifications } from "@/server/repositories/workflow.repository";
import { getPushSettingsSnapshot } from "@/server/repositories/push.repository";
import { PushSettingsPanel } from "@/features/portal/pwa/PushSettingsPanel";
import { describePushDevice } from "@/features/portal/pwa/device-label";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { getPublicEnv } from "@/lib/env/client";

export default async function AdminNotificationsPage() {
  const identity = await requireSystemizeOwner();
  const supabase = await createServerSupabaseClient();
  const [notifications, pushSettings] = await Promise.all([
    listUserNotifications(supabase, identity.userId, 25),
    getPushSettingsSnapshot(supabase, identity.userId),
  ]);
  const unread = notifications.filter(
    (notification) => notification.read_at === null
  ).length;

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">התראות</p>
          <h1>פעולות שממתינות לך</h1>
          <p>
            שליחת מסמך לבדיקה, בחירת מועד פגישה ואירועים אחרים שדורשים תשומת
            לב. 25 האחרונות.
          </p>
        </div>
        <span className="admin-chip" data-tone={unread ? "attention" : undefined}>
          {unread ? `${unread} שלא נקראו` : "הכול נקרא"}
        </span>
      </div>

      <section className="admin-section">
        <NotificationList notifications={notifications} />
      </section>
      <PushSettingsPanel
        variant="admin"
        publicKey={getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY}
        mutedCategories={pushSettings.mutedCategories}
        devices={pushSettings.devices.map((device) => ({
          id: device.id,
          label: describePushDevice(device.userAgent),
          lastSeenLabel: formatPortalDateTime(device.lastSeenAt),
        }))}
      />
    </main>
  );
}
