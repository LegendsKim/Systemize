export type PushDeliveryOutcome = "retry" | "dead";

export interface PushFailureDecision {
  readonly outcome: PushDeliveryOutcome;
  readonly removeSubscription: boolean;
  readonly errorCode: string;
  readonly retryAfterSeconds: number | null;
}

interface ProviderFailureShape {
  readonly statusCode?: unknown;
  readonly code?: unknown;
  readonly headers?: unknown;
}

function retryAfterSeconds(headers: unknown, now: Date): number | null {
  if (!headers || typeof headers !== "object") return null;
  const raw = (headers as Record<string, unknown>)["retry-after"];
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, Math.min(3600, Math.ceil(seconds)));
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.min(3600, Math.ceil((date.getTime() - now.getTime()) / 1000)));
}

export function classifyPushFailure(
  error: unknown,
  now = new Date()
): PushFailureDecision {
  const shaped =
    error && typeof error === "object" ? (error as ProviderFailureShape) : {};
  const status = typeof shaped.statusCode === "number" ? shaped.statusCode : null;
  const code = typeof shaped.code === "string" ? shaped.code.slice(0, 30) : null;

  if (status === 404 || status === 410) {
    return {
      outcome: "dead",
      removeSubscription: true,
      errorCode: `http_${status}`,
      retryAfterSeconds: null,
    };
  }
  if (status === 429 || (status !== null && status >= 500 && status <= 599)) {
    return {
      outcome: "retry",
      removeSubscription: false,
      errorCode: `http_${status}`,
      retryAfterSeconds: retryAfterSeconds(shaped.headers, now),
    };
  }
  if (status !== null && status >= 400 && status <= 499) {
    return {
      outcome: "dead",
      removeSubscription: false,
      errorCode: `http_${status}`,
      retryAfterSeconds: null,
    };
  }
  return {
    outcome: "retry",
    removeSubscription: false,
    errorCode: code ? `network_${code}` : "network_error",
    retryAfterSeconds: null,
  };
}

export interface SafePushPayload {
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly tag: string;
}

function safeNotificationHref(href: string): string {
  if (
    href === "/portal" ||
    href.startsWith("/portal/") ||
    href === "/admin" ||
    href.startsWith("/admin/")
  ) {
    return href.slice(0, 500);
  }
  return "/app";
}

export function buildSafePushPayload(input: {
  readonly kind: string;
  readonly href: string;
  readonly notificationId: string;
}): SafePushPayload {
  const actionRequired =
    input.kind.includes("requested") ||
    input.kind.includes("changes") ||
    input.kind.includes("submitted");
  return {
    title: actionRequired ? "נדרשת פעולה ב־SYSTEMIZE" : "עדכון בפרויקט",
    body: actionRequired
      ? "יש פעולה חדשה שממתינה לך באזור האישי."
      : "יש עדכון חדש שממתין לך באזור האישי.",
    href: safeNotificationHref(input.href),
    tag: input.notificationId.replaceAll("-", "").slice(0, 64),
  };
}
