import { z } from "zod";

const optionalPublicCredential = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL").optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalPublicCredential.refine(
    (value) => value === undefined || value.length >= 40,
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY is invalid"
  ),
});

type ClientEnv = z.infer<typeof clientSchema>;

let cachedClientEnv: ClientEnv | null = null;

export function getPublicEnv(): ClientEnv {
  if (cachedClientEnv) {
    return cachedClientEnv;
  }

  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  if (!parsed.success) {
    console.error("❌ Invalid client environment variables:", parsed.error.format());
    throw new Error("Invalid client environment variables");
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}
