"use client";
// Required: notification permission, PushManager and installed-app state are browser APIs.

import { useEffect, useState, useSyncExternalStore } from "react";
import { detectPwaPlatform, type PwaPlatformState } from "./platform";
import { enrollCurrentDevice, persistPushSubscription } from "./enroll";
import { mutableNotificationCategories } from "./push-schema";

interface Device {
  readonly id: string;
  readonly label: string;
  readonly lastSeenLabel: string;
}

interface PushSettingsPanelProps {
  readonly devices: readonly Device[];
  readonly mutedCategories: readonly string[];
  readonly publicKey?: string;
  readonly variant?: "portal" | "admin";
}

const subscribeToHydration = () => () => {};

const categoryLabels: Record<(typeof mutableNotificationCategories)[number], string> = {
  client_intake_submitted: "שאלון חדש נשלח",
  client_intake_approved: "שאלון אושר",
  client_intake_changes_requested: "נדרשו שינויים בשאלון",
  meeting_slots_opened: "נפתחו מועדים לפגישה",
  meeting_booked: "נקבעה פגישה",
  document_published: "פורסם מסמך חדש",
};

function timeoutSignal(milliseconds: number): AbortSignal {
  return AbortSignal.timeout(milliseconds);
}

export function PushSettingsPanel({
  devices: initialDevices,
  mutedCategories: initialMuted,
  publicKey,
  variant = "portal",
}: PushSettingsPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [devices, setDevices] = useState(initialDevices);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [muted, setMuted] = useState<readonly string[]>(initialMuted);
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const notificationSupported = hydrated && "Notification" in window;
  const platform: PwaPlatformState | null = hydrated
    ? detectPwaPlatform(
        navigator.userAgent,
        window.matchMedia("(display-mode: standalone)").matches,
        (navigator as Navigator & { standalone?: boolean }).standalone,
        "serviceWorker" in navigator && notificationSupported,
        "PushManager" in window
      )
    : null;
  const effectivePermission =
    notificationSupported && permission === "default"
      ? Notification.permission
      : permission;

  useEffect(() => {
    if (
      !platform?.supported ||
      !publicKey ||
      !notificationSupported ||
      effectivePermission !== "granted"
    ) {
      return;
    }

    let active = true;
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(async (subscription) => {
        if (!subscription) return;
        const id = await persistPushSubscription(subscription);
        if (active) setCurrentDeviceId(id);
      })
      .catch(() => {
        if (active) setStatus("לא הצלחנו לאמת את רישום המכשיר כרגע.");
      });
    return () => {
      active = false;
    };
  }, [
    effectivePermission,
    notificationSupported,
    platform?.supported,
    publicKey,
  ]);

  async function enablePush() {
    if (!platform?.supported || !publicKey) return;
    setPending(true);
    setStatus("");

    const result = await enrollCurrentDevice(publicKey);
    if (result.outcome !== "enabled" || !result.subscriptionId) {
      setPermission(
        result.outcome === "denied" ? "denied" : Notification.permission
      );
      setStatus(
        result.outcome === "denied"
          ? "ההרשאה לא ניתנה. אפשר לאשר התראות בהגדרות המכשיר."
          : "לא הצלחנו להפעיל התראות. אפשר לנסות שוב."
      );
      setPending(false);
      return;
    }

    const id = result.subscriptionId;
    setPermission("granted");
    setCurrentDeviceId(id);
    setDevices((current) =>
      current.some((device) => device.id === id)
        ? current
        : [{ id, label: "המכשיר הזה", lastSeenLabel: "עכשיו" }, ...current]
    );
    setStatus("ההתראות הופעלו במכשיר הזה.");
    setPending(false);
  }

  async function revokeDevice(id: string) {
    setPending(true);
    setStatus("");
    try {
      const response = await fetch("/api/push/subscriptions", {
        method: "DELETE",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: id }),
        signal: timeoutSignal(8_000),
      });
      if (!response.ok) throw new Error("delete_failed");
      if (id === currentDeviceId) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        await subscription?.unsubscribe();
        setCurrentDeviceId(null);
      }
      setDevices((current) => current.filter((device) => device.id !== id));
      setStatus("המכשיר בוטל.");
    } catch {
      setStatus("לא הצלחנו לבטל את המכשיר כרגע.");
    } finally {
      setPending(false);
    }
  }

  async function savePreferences() {
    setPending(true);
    setStatus("");
    try {
      const response = await fetch("/api/push/preferences", {
        method: "PATCH",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutedCategories: muted }),
        signal: timeoutSignal(8_000),
      });
      if (!response.ok) throw new Error("save_failed");
      setStatus("העדפות ההתראות נשמרו.");
    } catch {
      setStatus("לא הצלחנו לשמור את ההעדפות.");
    } finally {
      setPending(false);
    }
  }

  const className =
    variant === "admin" ? "pwa-settings pwa-settings-admin" : "pwa-settings";

  return (
    <section className={className} aria-labelledby={`push-settings-${variant}`}>
      <div>
        <p className="portal-eyebrow">PWA והתראות</p>
        <h2 id={`push-settings-${variant}`}>התראות במכשירים שלך</h2>
        <p>
          מרכז ההתראות באתר תמיד פעיל. Push הוא תוספת למכשירים שבחרת לחבר.
        </p>
      </div>

      {!publicKey ? (
        <p className="workflow-notice" role="status">
          Web Push מוכן בקוד אך מפתחות VAPID עדיין לא הוגדרו בסביבה.
        </p>
      ) : !platform ? (
        <p role="status">בודקים את יכולות המכשיר…</p>
      ) : !platform.supported ? (
        <p className="workflow-notice" role="status">
          הדפדפן הזה אינו תומך בהתראות Push.
        </p>
      ) : platform.ios && !platform.standalone ? (
        <div className="workflow-notice" role="status">
          <strong>באייפון יש להתקין תחילה את האפליקציה.</strong>
          <p>לחצו על שיתוף, בחרו „הוספה למסך הבית”, פתחו משם וחזרו למסך הזה.</p>
        </div>
      ) : effectivePermission === "denied" ? (
        <p className="workflow-notice" role="status">
          ההרשאה נחסמה. יש לפתוח את הגדרות האתר או האפליקציה במכשיר ולאפשר התראות.
        </p>
      ) : currentDeviceId ? (
        <p className="workflow-notice" role="status">
          המכשיר הזה מחובר להתראות.
        </p>
      ) : (
        <button
          type="button"
          className="portal-primary-action"
          disabled={pending}
          onClick={() => void enablePush()}
        >
          {pending ? "מחברים…" : "הפעלת התראות במכשיר הזה"}
        </button>
      )}

      {devices.length > 0 ? (
        <div className="pwa-device-list">
          <h3>מכשירים מחוברים</h3>
          <ul>
            {devices.map((device) => (
              <li key={device.id}>
                <span>
                  <strong>{device.id === currentDeviceId ? "המכשיר הזה" : device.label}</strong>
                  <small>נראה לאחרונה: {device.lastSeenLabel}</small>
                </span>
                <button
                  type="button"
                  className="portal-text-action"
                  disabled={pending}
                  onClick={() => void revokeDevice(device.id)}
                >
                  ביטול
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset className="pwa-preferences">
        <legend>התראות לא־קריטיות</legend>
        {mutableNotificationCategories.map((category) => (
          <label key={category}>
            <input
              type="checkbox"
              checked={!muted.includes(category)}
              onChange={(event) =>
                setMuted((current) =>
                  event.target.checked
                    ? current.filter((item) => item !== category)
                    : [...current, category]
                )
              }
            />
            {categoryLabels[category]}
          </label>
        ))}
        <p>תשלומים, חוזים, חתימות ואבטחה נשארים פעילים ואינם ניתנים להשתקה.</p>
        <button
          type="button"
          className="portal-secondary-button"
          disabled={pending}
          onClick={() => void savePreferences()}
        >
          שמירת העדפות
        </button>
      </fieldset>

      <p className="pwa-settings-status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
