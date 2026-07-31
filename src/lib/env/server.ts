import "server-only";
import { z } from "zod";

/**
 * An optional credential. `.env.example` ships these keys with empty values, so an
 * empty string must be read as "not configured" rather than as an invalid value
 * otherwise copying the example file would fail the whole schema.
 */
const optionalCredential = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalCredential,
  TELEGRAM_BOT_TOKEN: optionalCredential,
  TELEGRAM_CHAT_ID: optionalCredential,
  SYSTEMIZE_OWNER_GMAIL: optionalCredential,
  VAPID_PRIVATE_KEY: optionalCredential,
  VAPID_SUBJECT: optionalCredential,
  CRON_SECRET: optionalCredential,
  ZOOM_ACCOUNT_ID: optionalCredential,
  ZOOM_CLIENT_ID: optionalCredential,
  ZOOM_CLIENT_SECRET: optionalCredential,
  ZOOM_HOST_USER_ID: optionalCredential,
  GOOGLE_CALENDAR_CLIENT_ID: optionalCredential,
  GOOGLE_CALENDAR_CLIENT_SECRET: optionalCredential,
});

type ServerEnv = z.infer<typeof serverSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.format());
    throw new Error("Invalid server environment variables");
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export interface TelegramCredentials {
  readonly botToken: string;
  readonly chatId: string;
}

/**
 * Telegram is notification-only and optional per the approved client configuration,
 * §6. Both halves of the credential must be present to select it; a half-configured
 * environment is
 * treated as unconfigured so it can never produce a silently broken send path.
 *
 * Returns `null` when unconfigured. The caller decides what that means, in
 * production it is a fatal misconfiguration, in development it selects the console
 * provider.
 */
export function getTelegramCredentials(): TelegramCredentials | null {
  const env = getServerEnv();
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return null;
  }
  return { botToken: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID };
}

export function getSystemizeOwnerGmail(): string {
  // Trimmed before validating. This value is pasted into a hosting dashboard by hand, and
  // a trailing space there would otherwise fail the pattern and take the whole sign-in
  // callback down with a thrown error rather than a message anyone can act on.
  const value = getServerEnv().SYSTEMIZE_OWNER_GMAIL?.trim().toLowerCase();
  if (!value || !/^[^@\s]+@gmail\.com$/.test(value)) {
    throw new Error(
      "SYSTEMIZE_OWNER_GMAIL must contain the owner's gmail.com address."
    );
  }
  return value;
}

export interface WebPushServerCredentials {
  readonly privateKey: string;
  readonly subject: string;
}

export function getWebPushServerCredentials(): WebPushServerCredentials | null {
  const env = getServerEnv();
  const configured = [env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT];
  if (configured.every((value) => !value)) {
    return null;
  }
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error(
      "VAPID_PRIVATE_KEY and VAPID_SUBJECT must be configured together."
    );
  }
  if (!/^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT)) {
    throw new Error("VAPID_SUBJECT must be a mailto: or https:// URI.");
  }
  return {
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  };
}

export function getCronSecret(): string | null {
  const secret = getServerEnv().CRON_SECRET;
  if (!secret) return null;
  if (secret.length < 16) {
    throw new Error("CRON_SECRET must contain at least 16 characters.");
  }
  return secret;
}

export interface ZoomServerCredentials {
  readonly accountId: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly hostUserId: string;
}

export function getZoomServerCredentials(): ZoomServerCredentials | null {
  const env = getServerEnv();
  const values = [
    env.ZOOM_ACCOUNT_ID,
    env.ZOOM_CLIENT_ID,
    env.ZOOM_CLIENT_SECRET,
    env.ZOOM_HOST_USER_ID,
  ];
  if (values.every((value) => !value)) return null;
  if (values.some((value) => !value)) {
    throw new Error(
      "ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET and ZOOM_HOST_USER_ID must be configured together."
    );
  }
  if (
    env.ZOOM_ACCOUNT_ID!.length > 200 ||
    env.ZOOM_CLIENT_ID!.length > 300 ||
    env.ZOOM_CLIENT_SECRET!.length > 500 ||
    env.ZOOM_HOST_USER_ID!.length > 320
  ) {
    throw new Error("Zoom credentials exceed their allowed length.");
  }
  return {
    accountId: env.ZOOM_ACCOUNT_ID!,
    clientId: env.ZOOM_CLIENT_ID!,
    clientSecret: env.ZOOM_CLIENT_SECRET!,
    hostUserId: env.ZOOM_HOST_USER_ID!,
  };
}

export interface GoogleCalendarClientCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

export function getGoogleCalendarClientCredentials(): GoogleCalendarClientCredentials | null {
  const env = getServerEnv();
  const values = [
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
  ];
  if (values.every((value) => !value)) return null;
  if (values.some((value) => !value)) {
    throw new Error(
      "GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET must be configured together."
    );
  }
  if (
    env.GOOGLE_CALENDAR_CLIENT_ID!.length > 500 ||
    env.GOOGLE_CALENDAR_CLIENT_SECRET!.length > 500
  ) {
    throw new Error("Google Calendar credentials exceed their allowed length.");
  }
  return {
    clientId: env.GOOGLE_CALENDAR_CLIENT_ID!,
    clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET!,
  };
}

/** Test-only: clears the memoized environment so a test can vary process.env. */
export function resetServerEnvCache(): void {
  cachedServerEnv = null;
}
