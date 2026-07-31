"use client";
// Required: PWA install events, standalone detection and the delayed reveal are
// browser-only APIs.

import { useEffect, useRef, useState } from "react";

const dismissalKey = "systemize:pwa-login-install-dismissed:v1";

/**
 * How long the sign-in screen is left alone before the reminder arrives.
 *
 * A card that is already on screen when the page paints reads as an obstacle between the
 * visitor and the one button they came to press. Three seconds is long enough for the
 * gate to be seen and understood first, and short enough that the offer still lands while
 * someone is deciding rather than after they have signed in.
 */
const revealDelayMs = 3_000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    readonly outcome: "accepted" | "dismissed";
    readonly platform: string;
  }>;
}

type InstallMode = "checking" | "installable" | "ios" | "manual" | "hidden";

function isIosBrowser(userAgent: string): boolean {
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent))
  );
}

function wasDismissedInThisTab(): boolean {
  try {
    return sessionStorage.getItem(dismissalKey) === "true";
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    sessionStorage.setItem(dismissalKey, "true");
  } catch {
    // Storage can be unavailable in private browsing. Dismissal still works in memory.
  }
}

/** The phone-with-an-arrow mark on the reminder. Decorative, so it is hidden. */
function InstallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6" y="2.6" width="12" height="18.8" rx="2.6" />
      <path d="M12 7v6.2" />
      <path d="m9.5 10.9 2.5 2.5 2.5-2.5" />
      <path d="M10.6 18.2h2.8" />
    </svg>
  );
}

export function LoginPwaInstallPrompt() {
  const installEvent = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallMode>("checking");
  const [revealed, setRevealed] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const navigatorStandalone = (navigator as Navigator & {
      standalone?: boolean;
    }).standalone;

    if (
      standaloneQuery.matches ||
      navigatorStandalone === true ||
      wasDismissedInThisTab()
    ) {
      return;
    }

    const ios = isIosBrowser(navigator.userAgent);
    const fallbackTimer = window.setTimeout(() => {
      setMode((currentMode) =>
        currentMode === "checking" ? (ios ? "ios" : "manual") : currentMode
      );
    }, ios ? 0 : 1_200);
    // Independent of the mode detection above: the card is only allowed on screen once
    // the visitor has had the gate to themselves for a moment.
    const revealTimer = window.setTimeout(() => setRevealed(true), revealDelayMs);

    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      installEvent.current = event as BeforeInstallPromptEvent;
      setMode("installable");
    };
    const handleInstalled = () => {
      installEvent.current = null;
      setMode("hidden");
    };
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMode("hidden");
      }
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    standaloneQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(revealTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
      standaloneQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const dismiss = () => {
    rememberDismissal();
    setMode("hidden");
  };

  const install = async () => {
    const event = installEvent.current;
    if (!event) {
      setInstructionsVisible(true);
      return;
    }

    setPending(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      installEvent.current = null;
      setMode(choice.outcome === "accepted" ? "hidden" : "manual");
    } catch {
      installEvent.current = null;
      setMode("manual");
      setInstructionsVisible(true);
    } finally {
      setPending(false);
    }
  };

  if (!revealed || mode === "checking" || mode === "hidden") {
    return null;
  }

  const hasNativeInstall = mode === "installable";
  const instruction =
    mode === "ios"
      ? "ב־iPhone: לחצו על כפתור השיתוף בדפדפן ואז על „הוספה למסך הבית”."
      : "פתחו את תפריט הדפדפן ובחרו „התקנת האפליקציה” או „הוספה למסך הבית”.";

  return (
    <aside
      className="login-pwa-install"
      aria-labelledby="login-pwa-install-title"
      aria-describedby="login-pwa-install-description"
      aria-live="polite"
    >
      <div className="login-pwa-install-head">
        <span className="login-pwa-install-icon" aria-hidden="true">
          <InstallIcon />
        </span>
        <div className="login-pwa-install-copy">
          <strong id="login-pwa-install-title">
            SYSTEMIZE עובדת טוב יותר כאפליקציה
          </strong>
          <p id="login-pwa-install-description">
            פתיחה ישירה ממסך הבית, בלי לחפש בדפדפן, עם התראה על כל עדכון בפרויקט.
          </p>
        </div>
        <button
          type="button"
          className="login-pwa-install-close"
          aria-label="סגירת תזכורת ההתקנה"
          onClick={dismiss}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" />
          </svg>
        </button>
      </div>

      {instructionsVisible || !hasNativeInstall ? (
        <p className="login-pwa-install-instruction">{instruction}</p>
      ) : null}

      <div className="login-pwa-install-actions">
        <button
          type="button"
          className="login-pwa-install-action"
          disabled={pending}
          onClick={
            hasNativeInstall
              ? () => void install()
              : () => setInstructionsVisible(true)
          }
        >
          {pending
            ? "פותחים התקנה…"
            : hasNativeInstall
              ? "התקנת האפליקציה"
              : "איך מתקינים?"}
        </button>
        <button
          type="button"
          className="login-pwa-install-later"
          onClick={dismiss}
        >
          לא עכשיו
        </button>
      </div>
    </aside>
  );
}
