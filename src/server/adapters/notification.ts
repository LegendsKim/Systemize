import "server-only";
import type { ProviderErrorCategory } from "@/lib/network/provider-errors";
import { getTelegramCredentials, type TelegramCredentials } from "@/lib/env/server";
import { TelegramNotificationProvider } from "./telegram-notification";

/**
 * The provider-neutral notification boundary.
 *
 * Notifications are best-effort and non-authoritative. Nothing behind this
 * interface may fail, delay, or alter a durable write.
 */

export type NotificationType = "lead_received" | "system_alert";

export interface Notification {
  type: NotificationType;
  subject: string;
  body: string;
  /**
   * Safe correlation data only, ids and categories. Never lead PII: this is the
   * one field a future provider is most likely to log verbatim.
   */
  metadata?: Record<string, string>;
}

export interface SendOptions {
  /**
   * Caller-owned deadline. The caller, not the provider, decides how long a
   * best-effort notification may hold a visitor's submission open.
   */
  signal?: AbortSignal;
}

export interface NotificationResult {
  success: boolean;
  providerId?: string;
  error?: {
    category: ProviderErrorCategory;
    message: string;
  };
}

export interface NotificationProvider {
  send(notification: Notification, options?: SendOptions): Promise<NotificationResult>;
}

/**
 * Development fallback. It prints the subject and safe metadata only, never the
 * body, which carries the lead's contact details.
 */
export class ConsoleNotificationProvider implements NotificationProvider {
  async send(notification: Notification): Promise<NotificationResult> {
    console.info(
      "[notification]",
      JSON.stringify({
        type: notification.type,
        subject: notification.subject,
        metadata: notification.metadata,
        provider: "console",
      })
    );
    return { success: true, providerId: "console" };
  }
}

export interface NotificationEnvironment {
  readonly telegram: TelegramCredentials | null;
  readonly isProduction: boolean;
}

/**
 * Provider selection, as a pure function of configuration so it can be tested
 * without an environment.
 *
 * A production deployment with no Telegram credentials throws rather than quietly
 * selecting the console provider. Leads would still be persisted, the durable
 * write happens first, but the owner would never be told about them, which is the
 * failure mode most likely to go unnoticed. It fails loudly instead.
 */
export function resolveNotificationProvider(
  environment: NotificationEnvironment
): NotificationProvider {
  if (environment.telegram) {
    return new TelegramNotificationProvider(environment.telegram);
  }
  if (environment.isProduction) {
    throw new Error(
      "No notification provider is configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID."
    );
  }
  return new ConsoleNotificationProvider();
}

export function createNotificationProvider(): NotificationProvider {
  return resolveNotificationProvider({
    telegram: getTelegramCredentials(),
    isProduction: process.env.NODE_ENV === "production",
  });
}
