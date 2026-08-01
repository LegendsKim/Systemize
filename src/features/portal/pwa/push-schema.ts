import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(2000),
  keys: z.object({
    p256dh: z.string().min(32).max(256),
    auth: z.string().min(8).max(128),
  }),
  userAgent: z.string().max(300).nullable(),
});

export const pushSubscriptionDeleteSchema = z.object({
  subscriptionId: z.string().uuid(),
});

export const protectedNotificationPrefixes = [
  "payment_",
  "contract_",
  "signature_",
  "invitation_",
] as const;

export const mutableNotificationCategories = [
  "client_intake_submitted",
  "client_intake_approved",
  "client_intake_changes_requested",
  "meeting_slots_opened",
  "meeting_booked",
  "document_published",
] as const;

export const notificationPreferencesSchema = z.object({
  mutedCategories: z
    .array(z.enum(mutableNotificationCategories))
    .max(mutableNotificationCategories.length),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
