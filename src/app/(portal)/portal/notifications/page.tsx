import { requirePortalIdentity } from "@/features/portal/auth/session";
import { NotificationList } from "@/features/portal/workflow/NotificationList";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listUserNotifications } from "@/server/repositories/workflow.repository";

export default async function PortalNotificationsPage() {
  const identity = await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const notifications = await listUserNotifications(
    supabase,
    identity.userId,
    25
  );

  return (
    <main id="main-content" className="portal-main">
      <div className="portal-page-heading">
        <p className="portal-eyebrow">עדכונים</p>
        <h1>מה השתנה בפרויקט</h1>
        <p>אישורים, מועדים ותשלומים נשמרים כאן לפי סדר הזמן.</p>
      </div>
      <NotificationList notifications={notifications} />
    </main>
  );
}
