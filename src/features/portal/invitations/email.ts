import { z } from "zod";

export const gmailAddressSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("נדרשת כתובת Gmail תקינה.")
  .max(320, "כתובת האימייל ארוכה מדי.")
  .refine(
    (email) => email.endsWith("@gmail.com"),
    "בשלב זה ניתן להתחבר באמצעות כתובת gmail.com בלבד."
  );

export function normalizeGmailAddress(value: string): string {
  return gmailAddressSchema.parse(value);
}

export function isAllowedGmailAddress(value: unknown): value is string {
  return gmailAddressSchema.safeParse(value).success;
}
