import { urlBase64ToUint8Array } from "./platform";

/**
 * Turning this browser into a device that can be reached.
 *
 * Shared by the settings panel and the first-run orientation, because two copies of a
 * permission prompt plus a `pushManager.subscribe` plus a POST is two chances to drift on
 * what "enabled" means. The caller decides what to say about the result; this decides
 * only what happened.
 */

export type EnrollmentOutcome = "enabled" | "denied" | "failed";

export interface EnrollmentResult {
  readonly outcome: EnrollmentOutcome;
  readonly subscriptionId?: string;
}

const requestTimeoutMs = 8_000;

export async function persistPushSubscription(
  subscription: PushSubscription
): Promise<string> {
  const json = subscription.toJSON();
  const response = await fetch("/api/push/subscriptions", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent.slice(0, 300),
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const result = (await response.json()) as { id?: string; error?: string };
  if (!response.ok || !result.id) {
    throw new Error(result.error ?? "save_failed");
  }
  return result.id;
}

export async function enrollCurrentDevice(
  publicKey: string
): Promise<EnrollmentResult> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { outcome: "denied" };
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    return {
      outcome: "enabled",
      subscriptionId: await persistPushSubscription(subscription),
    };
  } catch {
    return { outcome: "failed" };
  }
}
