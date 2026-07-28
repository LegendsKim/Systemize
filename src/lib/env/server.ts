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
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  TELEGRAM_BOT_TOKEN: optionalCredential,
  TELEGRAM_CHAT_ID: optionalCredential,
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

/** Test-only: clears the memoized environment so a test can vary process.env. */
export function resetServerEnvCache(): void {
  cachedServerEnv = null;
}
