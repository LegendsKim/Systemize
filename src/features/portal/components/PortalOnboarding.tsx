"use client";
// Required: notification permission and installed-app detection are browser APIs, and the
// screen dismisses itself in place rather than through a navigation.

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  portalOrientationPointers,
  portalOrientationSteps,
} from "@/features/portal/portal-orientation";
import { completePortalOnboarding } from "@/features/portal/onboarding-actions";
import { enrollCurrentDevice } from "@/features/portal/pwa/enroll";
import { detectPwaPlatform, type PwaPlatformState } from "@/features/portal/pwa/platform";

interface PortalOnboardingProps {
  readonly firstName: string;
  /** Absent when VAPID keys are not configured; the screen then omits the offer. */
  readonly publicKey?: string;
  readonly alreadySubscribed: boolean;
}

const subscribeToHydration = () => () => {};

type PushStep = "offer" | "enabled" | "denied" | "failed";

export function PortalOnboarding({
  firstName,
  publicKey,
  alreadySubscribed,
}: PortalOnboardingProps) {
  const router = useRouter();
  const [pushStep, setPushStep] = useState<PushStep>(
    alreadySubscribed ? "enabled" : "offer"
  );
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);

  /*
   * Capability detection has to wait for mount: the server has no user agent to inspect
   * and no display mode to match, so deciding this during render would make the first
   * client paint disagree with the server's.
   */
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

  async function enableNotifications() {
    if (!publicKey) return;
    setPending(true);
    const result = await enrollCurrentDevice(publicKey);
    setPushStep(
      result.outcome === "enabled"
        ? "enabled"
        : result.outcome === "denied"
          ? "denied"
          : "failed"
    );
    setPending(false);
  }

  async function finish() {
    setFinishing(true);
    setFinishError(false);
    const result = await completePortalOnboarding();
    if (!result.ok) {
      setFinishError(true);
      setFinishing(false);
      return;
    }
    /*
     * The server decides what the home screen is; refreshing lets it re-render with the
     * orientation behind us instead of this component guessing what comes next.
     */
    router.refresh();
    setFinishing(false);
  }

  return (
    <section className="portal-onboarding" aria-labelledby="portal-onboarding-title">
      <div className="portal-onboarding-intro">
        <p className="portal-eyebrow">ברוך הבא</p>
        <h1 id="portal-onboarding-title">
          {firstName ? `${firstName}, כך נעבוד יחד` : "כך נעבוד יחד"}
        </h1>
        <p>
          המסך הזה מוצג פעם אחת בלבד. הוא מראה את כל התהליך מתחילתו ועד סופו,
          כדי שתמיד יהיה ברור איפה אנחנו עומדים ומה השלב הבא.
        </p>
      </div>

      <ol className="portal-onboarding-steps">
        {portalOrientationSteps.map((step) => (
          <li key={step.index}>
            <span aria-hidden="true">{step.index}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="portal-onboarding-pointers">
        <h2>איפה כל דבר נמצא</h2>
        <dl>
          {portalOrientationPointers.map((pointer) => (
            <div key={pointer.label}>
              <dt>{pointer.label}</dt>
              <dd>{pointer.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      {publicKey && (
        <div className="portal-onboarding-push">
          <h2>שלא תפספס עדכון</h2>
          {pushStep === "enabled" ? (
            <p role="status">
              ההתראות פעילות במכשיר הזה. נעדכן אותך כאן על כל שלב שדורש אותך.
            </p>
          ) : !platform ? (
            <p role="status">בודקים את יכולות המכשיר…</p>
          ) : !platform.supported ? (
            <p>
              הדפדפן הזה אינו תומך בהתראות. כל עדכון ימשיך להופיע במסך „עדכונים”.
            </p>
          ) : platform.ios && !platform.standalone ? (
            <p>
              באייפון יש להוסיף את האזור האישי למסך הבית: לחיצה על „שיתוף” ואז
              „הוספה למסך הבית”. אחר כך אפשר להפעיל התראות ממסך ההגדרות.
            </p>
          ) : pushStep === "denied" ? (
            <p role="status">
              ההרשאה לא ניתנה. אפשר לאשר התראות בהגדרות הדפדפן ולחזור למסך
              ההגדרות באזור האישי.
            </p>
          ) : (
            <>
              <p>
                הפעלת התראות בנייד היא הדרך לדעת מיד כשאנחנו מבקשים משהו או
                מפרסמים מסמך. אפשר לבטל בכל רגע מההגדרות.
              </p>
              <button
                type="button"
                className="portal-secondary-button"
                disabled={pending}
                onClick={() => void enableNotifications()}
              >
                {pending ? "מחברים…" : "הפעלת התראות במכשיר הזה"}
              </button>
              {pushStep === "failed" && (
                <p role="status">
                  לא הצלחנו להפעיל התראות כרגע. אפשר לנסות שוב מהגדרות החשבון.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="portal-primary-action"
        disabled={finishing}
        onClick={() => void finish()}
      >
        {finishing ? "רגע…" : "הבנתי, קדימה לאזור האישי"}
      </button>
      {finishError && (
        <p className="workflow-form-message" role="alert">
          לא הצלחנו לשמור את סיום ההדרכה. אפשר לנסות שוב בעוד רגע.
        </p>
      )}
    </section>
  );
}
