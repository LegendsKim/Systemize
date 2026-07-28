import "server-only";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/network/fetch-with-retry";
import type { ProviderErrorCategory } from "@/lib/network/provider-errors";
import type {
  Notification,
  NotificationProvider,
  NotificationResult,
  SendOptions,
} from "./notification";

/**
 * Telegram Bot API `sendMessage`.
 *
 * Notification-only and non-authoritative (AGENTS.client.md §6): by the time this
 * runs, the lead is already durable. Every failure here is normalised into a typed
 * result and swallowed by the caller.
 *
 * Credentials are injected rather than read here, so the adapter is unit-testable
 * without an environment and no build or test ever needs a real bot token.
 */

export interface TelegramProviderConfig {
  readonly botToken: string;
  readonly chatId: string;
  /** Per-attempt timeout. Every outbound call has an explicit one (AGENTS.md §5). */
  readonly timeoutMs?: number;
  /** Retries after the first attempt. Bounded, jittered, backed off. */
  readonly maxRetries?: number;
  /** Overridable only so tests can point at a local fixture host. */
  readonly apiBaseUrl?: string;
}

const DEFAULT_TIMEOUT_MS = 2_500;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_API_BASE_URL = "https://api.telegram.org";

/**
 * Retried statuses only. Ordinary 4xx, a bad token (401), a chat the bot was
 * removed from (403), a malformed payload (400), are configuration or contract
 * faults that no amount of retrying fixes, so they are never retried.
 */
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

/** Telegram's hard limit is 4096 UTF-16 code units per message. */
const MESSAGE_LIMIT = 3_500;

const telegramResponseSchema = z.object({
  ok: z.boolean(),
  result: z.object({ message_id: z.number() }).optional(),
  description: z.string().optional(),
});

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

export class TelegramNotificationProvider implements NotificationProvider {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly endpoint: string;

  constructor(private readonly config: TelegramProviderConfig) {
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseUrl = config.apiBaseUrl ?? DEFAULT_API_BASE_URL;
    this.endpoint = `${baseUrl}/bot${config.botToken}/sendMessage`;
  }

  async send(
    notification: Notification,
    options: SendOptions = {}
  ): Promise<NotificationResult> {
    const result = await fetchWithRetry<unknown>(this.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text: this.composeText(notification),
        disable_web_page_preview: true,
      }),
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      retryableStatuses: RETRYABLE_STATUSES,
      // The message body carries the lead's durable id, so a duplicate delivery is
      // recognisable by the owner and is a strictly better outcome than a lost
      // notification. That is the trade AGENTS.client.md §6 asks for.
      isIdempotent: true,
      ...(options.signal ? { signal: options.signal } : {}),
    });

    if (!result.ok) {
      return {
        success: false,
        error: {
          category: (result.error?.category ?? "transient_failure") as ProviderErrorCategory,
          // Telegram's own text only, never the notification payload.
          message: result.error?.message ?? "Telegram sendMessage failed",
        },
      };
    }

    const parsed = telegramResponseSchema.safeParse(result.data);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          category: "permanent_rejection",
          message: "Telegram returned an unrecognised payload",
        },
      };
    }
    if (!parsed.data.ok) {
      return {
        success: false,
        error: {
          category: "permanent_rejection",
          message: parsed.data.description ?? "Telegram rejected the message",
        },
      };
    }

    return {
      success: true,
      providerId: parsed.data.result
        ? `telegram:${String(parsed.data.result.message_id)}`
        : "telegram",
    };
  }

  /**
   * Plain text, no `parse_mode`. Visitor-supplied text can then never break the
   * message or be interpreted as markup, which removes the entire escaping problem.
   *
   * The contact details are the point of the notification, the owner cannot act on
   * a lead without them. Nothing beyond what is needed to make contact and to find
   * the row is included, and none of it is ever logged.
   */
  private composeText(notification: Notification): string {
    const lines = [notification.subject, "", notification.body];
    return truncate(lines.join("\n"), MESSAGE_LIMIT);
  }
}
