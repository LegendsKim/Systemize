"use client";
// Required: PWA install events and standalone detection are browser-only APIs.

import { useEffect, useRef, useState } from "react";

const dismissalKey = "systemize:pwa-login-install-dismissed:v1";

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

export function LoginPwaInstallPrompt() {
  const installEvent = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallMode>("checking");
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

  if (mode === "checking" || mode === "hidden") {
    return null;
  }

  const hasNativeInstall = mode === "installable";
  const instruction =
    mode === "ios"
      ? "ב־iPhone: לחצו על שיתוף בדפדפן ואז על „הוספה למסך הבית”."
      : "פתחו את תפריט הדפדפן ובחרו „התקנת האפליקציה” או „הוספה למסך הבית”.";

  return (
    <aside
      className="login-pwa-install"
      aria-labelledby="login-pwa-install-title"
      aria-describedby="login-pwa-install-description"
      aria-live="polite"
    >
      <button
        type="button"
        className="login-pwa-install-close"
        aria-label="סגירת תזכורת ההתקנה"
        onClick={dismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
      <span className="login-pwa-install-icon" aria-hidden="true">
        ↧
      </span>
      <div className="login-pwa-install-copy">
        <strong id="login-pwa-install-title">
          SYSTEMIZE עובדת טוב יותר כאפליקציה
        </strong>
        <p id="login-pwa-install-description">
          התקנה למסך הבית מאפשרת פתיחה מהירה והפעלת התראות במכשיר.
        </p>
        {instructionsVisible || !hasNativeInstall ? (
          <p className="login-pwa-install-instruction">{instruction}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="login-pwa-install-action"
        disabled={pending}
        onClick={hasNativeInstall ? () => void install() : () => setInstructionsVisible(true)}
      >
        {pending
          ? "פותחים התקנה…"
          : hasNativeInstall
            ? "התקנת האפליקציה"
            : "איך מתקינים?"}
      </button>
    </aside>
  );
}
