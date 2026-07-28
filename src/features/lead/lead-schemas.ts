import { z } from "zod";
import { leadValidation, type LeadFieldName } from "./lead-content";

/**
 * The one lead schema. The client runs it to fail fast, the Server Action runs it as
 * the authority, the server never trusts the client's verdict, it just happens to
 * reach the same one with the same messages.
 *
 * Only the visitor-supplied fields appear here. `id`, `created_at` and `request_id`
 * are generated on the server and are not part of the accepted payload at all, so a
 * client that submits them is ignored rather than trusted.
 */

/**
 * Israeli phone numbers, tolerant of the separators people actually type. Deliberately
 * loose: rejecting a reachable number costs a lead, and the number is only ever dialled
 * by a human.
 */
const phonePattern = /^\+?[\d\s\-()]{9,20}$/;

export const leadSchema = z.object({
  full_name: z
    .string({ error: leadValidation.full_name.required })
    .trim()
    .min(1, leadValidation.full_name.required)
    .min(2, leadValidation.full_name.tooShort)
    .max(200, leadValidation.full_name.tooLong),

  business_name: z
    .string({ error: leadValidation.business_name.required })
    .trim()
    .min(1, leadValidation.business_name.required)
    .min(2, leadValidation.business_name.tooShort)
    .max(200, leadValidation.business_name.tooLong),

  phone: z
    .string({ error: leadValidation.phone.required })
    .trim()
    .min(1, leadValidation.phone.required)
    .regex(phonePattern, leadValidation.phone.invalid),

  email: z
    .string({ error: leadValidation.email.required })
    .trim()
    .min(1, leadValidation.email.required)
    .max(320, leadValidation.email.tooLong)
    .pipe(z.email(leadValidation.email.invalid))
    .transform((value) => value.toLowerCase()),

  message: z
    .string({ error: leadValidation.message.required })
    .trim()
    .min(1, leadValidation.message.required)
    .min(10, leadValidation.message.tooShort)
    .max(5000, leadValidation.message.tooLong),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type LeadFieldErrors = Partial<Record<LeadFieldName, string[]>>;

/**
 * Flattens a Zod failure into per-field messages. Unknown paths are dropped rather
 * than surfaced, so a schema change can never leak an internal path into the UI.
 */
export function toFieldErrors(error: z.ZodError): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in leadValidation)) continue;
    const key = field as LeadFieldName;
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/**
 * Parses whatever the form sent. `FormData` values may be `File`, so anything that is
 * not a string is discarded before validation instead of being coerced.
 */
export function parseLeadFormData(
  formData: FormData
): z.ZodSafeParseResult<LeadInput> {
  const candidate: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") candidate[key] = value;
  }
  return leadSchema.safeParse(candidate);
}

/**
 * The idempotency key is a client-generated UUID per form session (AGENTS.client.md
 * §6). It is validated for shape before it is used as a database key.
 */
export const idempotencyKeySchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
