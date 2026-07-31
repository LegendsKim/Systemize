import { requirePortalIdentity } from "@/features/portal/auth/session";
import { describePushDevice } from "@/features/portal/pwa/device-label";
import { PushSettingsPanel } from "@/features/portal/pwa/PushSettingsPanel";
import { formatPortalDateTime } from "@/features/portal/workflow/format";
import { getPublicEnv } from "@/lib/env/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPushSettingsSnapshot } from "@/server/repositories/push.repository";

export default async function PortalSettingsPage() {
  const identity = await requirePortalIdentity();
  const supabase = await createServerSupabaseClient();
  const snapshot = await getPushSettingsSnapshot(supabase, identity.userId);
  const publicKey = getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  return (
    <main id="main-content" className="portal-main">
      <div className="portal-page-heading">
        <p className="portal-eyebrow">הגדרות</p>
        <h1>החשבון שלך</h1>
        <p>ניהול מכשירים, התראות והעדפות החשבון.</p>
      </div>
      <PushSettingsPanel
        publicKey={publicKey}
        mutedCategories={snapshot.mutedCategories}
        devices={snapshot.devices.map((device) => ({
          id: device.id,
          label: describePushDevice(device.userAgent),
          lastSeenLabel: formatPortalDateTime(device.lastSeenAt),
        }))}
      />
    </main>
  );
}
