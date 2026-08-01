import { z } from "zod";
import { gmailAddressSchema } from "@/features/portal/invitations/email";

export const companyProjectSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "יש להזין שם חברה.")
    .max(160, "שם החברה ארוך מדי."),
  projectName: z
    .string()
    .trim()
    .min(2, "יש להזין שם פרויקט.")
    .max(160, "שם הפרויקט ארוך מדי."),
  idempotencyKey: z.string().uuid("מזהה הטופס אינו תקין."),
});

export const projectInvitationSchema = z.object({
  projectId: z.string().uuid("מזהה הפרויקט אינו תקין."),
  invitationId: z.string().uuid("מזהה ההזמנה אינו תקין."),
  invitationToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/, "טוקן ההזמנה אינו תקין."),
  idempotencyKey: z.string().uuid("מזהה הטופס אינו תקין."),
  fullName: z
    .string()
    .trim()
    .min(2, "יש להזין שם מלא.")
    .max(120, "השם ארוך מדי."),
  email: gmailAddressSchema,
  phone: z
    .string()
    .trim()
    .min(8, "יש להזין מספר טלפון.")
    .max(32, "מספר הטלפון ארוך מדי."),
});

export const invitationLifecycleSchema = z.object({
  projectId: z.string().uuid("מזהה הפרויקט אינו תקין."),
  invitationId: z.string().uuid("מזהה ההזמנה אינו תקין."),
  idempotencyKey: z.string().uuid("מזהה הפעולה אינו תקין."),
});

export const invitationReissueSchema = invitationLifecycleSchema.extend({
  replacementInvitationId: z.string().uuid("מזהה ההזמנה החדשה אינו תקין."),
  invitationToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/, "טוקן ההזמנה אינו תקין."),
});

export const projectDetailsSchema = z.object({
  projectId: z.string().uuid("מזהה הפרויקט אינו תקין."),
  companyName: z
    .string()
    .trim()
    .min(2, "יש להזין שם חברה.")
    .max(160, "שם החברה ארוך מדי."),
  projectName: z
    .string()
    .trim()
    .min(2, "יש להזין שם פרויקט.")
    .max(160, "שם הפרויקט ארוך מדי."),
  idempotencyKey: z.string().uuid("מזהה הפעולה אינו תקין."),
});

export const companyPersonSchema = z.object({
  projectId: z.string().uuid("מזהה הפרויקט אינו תקין."),
  personId: z.string().uuid("מזהה איש הקשר אינו תקין."),
  fullName: z
    .string()
    .trim()
    .min(2, "יש להזין שם מלא.")
    .max(120, "השם ארוך מדי."),
  email: gmailAddressSchema,
  phone: z
    .string()
    .trim()
    .min(8, "יש להזין מספר טלפון.")
    .max(32, "מספר הטלפון ארוך מדי."),
  idempotencyKey: z.string().uuid("מזהה הפעולה אינו תקין."),
});
