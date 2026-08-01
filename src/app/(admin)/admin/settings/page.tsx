import { retryMeetingIntegrations } from "@/features/portal/admin/meeting-integration-actions";
import { integrationNotices } from "@/features/portal/admin/integration-notices";
import { runSystemHealthCheck } from "@/features/portal/admin/system-health-actions";
import { SystemHealthCard } from "@/features/portal/admin/SystemHealthCard";
import { requireSystemizeOwner } from "@/features/portal/auth/session";
import { describePushDevice } from "@/features/portal/pwa/device-label";
import { PushSettingsPanel } from "@/features/portal/pwa/PushSettingsPanel";
import { NotificationList } from "@/features/portal/workflow/NotificationList";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { getPublicEnv } from "@/lib/env/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getGoogleCalendarConnectionStatus } from "@/server/repositories/meeting-integration.repository";
import { listOwnerProjects } from "@/server/repositories/portal.repository";
import { getPushSettingsSnapshot } from "@/server/repositories/push.repository";
import { getSystemHealthSnapshot } from "@/server/repositories/system-health.repository";
import {
  listProjectWorkflows,
  listUserNotifications,
} from "@/server/repositories/workflow.repository";

interface AdminSettingsPageProps {
  readonly searchParams: Promise<{ notice?: string }>;
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const identity = await requireSystemizeOwner();
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [projects, notifications, pushSettings, calendarConnection, health] =
    await Promise.all([
      listOwnerProjects(supabase),
      listUserNotifications(supabase, identity.userId, 25),
      getPushSettingsSnapshot(supabase, identity.userId),
      getGoogleCalendarConnectionStatus(),
      getSystemHealthSnapshot(supabase),
    ]);
  const workflows = await listProjectWorkflows(
    supabase,
    projects.map((project) => project.id)
  );
  const meetingIntegrations = [...workflows.values()].flatMap(
    (workflow) => workflow.meetingIntegrations
  );
  const ready = meetingIntegrations.filter((item) => item.status === "ready").length;
  const pending = meetingIntegrations.filter((item) =>
    ["pending", "provisioning", "retry"].includes(item.status)
  ).length;
  const attention = meetingIntegrations.filter(
    (item) => item.status === "attention"
  ).length;
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <main id="main-content" className="admin-page">
      <div className="admin-page-head">
        <div>
          <p className="admin-eyebrow">הגדרות</p>
          <h1>מערכות, חיבורים והתראות</h1>
          <p>
            מקום אחד לניהול החיבורים, בדיקות התקינות, ההתראות והמכשירים שמקבלים Push.
          </p>
        </div>
        <form action={runSystemHealthCheck}>
          <button type="submit" className="admin-button">
            בדיקת מערכות עכשיו
          </button>
        </form>
      </div>

      {query.notice && integrationNotices[query.notice] && (
        <p className="workflow-notice" role="status">
          {integrationNotices[query.notice]}
        </p>
      )}

      <SystemHealthCard snapshot={health} detailed />

      <section
        className="admin-integration-status"
        data-status={calendarConnection.connected ? "connected" : "disconnected"}
        aria-labelledby="calendar-status-title"
      >
        <div>
          <p className="admin-eyebrow">חיבורי פגישות</p>
          <h2 id="calendar-status-title">
            {calendarConnection.connected
              ? "Google Calendar מחובר"
              : "Google Calendar אינו מחובר"}
          </h2>
          <p>
            {calendarConnection.connected
              ? `החיבור ל־${calendarConnection.connectedEmail} שמור ומוכן לשליחת זימונים.`
              : "יש לחבר את חשבון הבעלים כדי לשלוח זימונים ללקוחות."}
          </p>
          <p className="admin-integration-counts">
            <span>מוכנות: {ready}</span>
            <span>ממתינות: {pending}</span>
            <span>דורשות בדיקה: {attention}</span>
          </p>
        </div>
        <div className="admin-integration-actions">
          <a
            href="/api/integrations/google/connect"
            className="admin-button"
            data-variant="secondary"
          >
            {calendarConnection.connected ? "רענון חיבור Calendar" : "חיבור Calendar"}
          </a>
          {calendarConnection.connected && pending + attention > 0 && (
            <form action={retryMeetingIntegrations}>
              <button type="submit" className="admin-button">
                יצירת Zoom וזימון עכשיו
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="settings-notifications-title">
        <div className="admin-section-head">
          <div>
            <h2 id="settings-notifications-title">התראות אחרונות</h2>
            <p>25 ההתראות האחרונות באזור הניהול.</p>
          </div>
          <span className="admin-chip" data-tone={unread ? "attention" : undefined}>
            {unread ? `${unread} שלא נקראו` : "הכול נקרא"}
          </span>
        </div>
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
