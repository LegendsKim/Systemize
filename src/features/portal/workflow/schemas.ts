import { z } from "zod";
import {
  intakeFieldNames,
  type IntakeAnswers,
  type IntakeFieldName,
} from "./intake";

const answerSchema = z.string().trim().max(5000, "התשובה ארוכה מדי.");

const requiredOnSubmit: ReadonlySet<IntakeFieldName> = new Set([
  "companyOverview",
  "productsAndServices",
  "decisionProcess",
  "currentProcess",
  "primaryChallenges",
  "dataSources",
  "goals",
  "successMetrics",
  "usersAndRoles",
  "mustHaveFeatures",
  "securityRequirements",
]);

export const projectWorkflowIdSchema = z.string().uuid("מזהה הפרויקט אינו תקין.");

export function parseIntakeForm(
  formData: FormData,
  submit: boolean
):
  | { readonly success: true; readonly answers: IntakeAnswers }
  | {
      readonly success: false;
      readonly fieldErrors: Record<string, string[] | undefined>;
    } {
  const answers = {} as IntakeAnswers;
  const fieldErrors: Record<string, string[] | undefined> = {};

  for (const name of intakeFieldNames) {
    const rawValue = formData.get(name);
    const result = answerSchema.safeParse(
      typeof rawValue === "string" ? rawValue : ""
    );
    if (!result.success) {
      fieldErrors[name] = result.error.issues.map((issue) => issue.message);
      answers[name] = "";
      continue;
    }

    answers[name] = result.data;
    if (submit && requiredOnSubmit.has(name) && result.data.length < 10) {
      fieldErrors[name] = ["כדי לשלוח, יש להוסיף תשובה מעט מפורטת יותר."];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }
  return { success: true, answers };
}

export const intakeReviewSchema = z.object({
  projectId: projectWorkflowIdSchema,
  decision: z.enum(["approve", "request_changes"]),
  reviewNote: z.string().trim().max(2000, "ההערה ארוכה מדי."),
  idempotencyKey: z.string().uuid(),
});

export const meetingSlotSchema = z
  .object({
    projectId: projectWorkflowIdSchema,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    idempotencyKey: z.string().uuid(),
  })
  .refine(
    (value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    { message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה." }
  );

export const meetingBookingSchema = z.object({
  projectId: projectWorkflowIdSchema,
  slotId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export const paymentRequestSchema = z.object({
  projectId: projectWorkflowIdSchema,
  kind: z.enum(["discovery", "initial_deposit", "balance"]),
  title: z.string().trim().min(3, "יש להזין כותרת.").max(160),
  amountIls: z.coerce
    .number()
    .positive("יש להזין סכום חיובי.")
    .max(10_000_000, "הסכום גבוה מדי."),
  paymentUrl: z.url("יש להזין קישור תשלום תקין.").refine(
    (url) => url.startsWith("https://"),
    "קישור התשלום חייב להיות מאובטח (https)."
  ),
  idempotencyKey: z.string().uuid(),
});

export const paymentReceivedSchema = z.object({
  projectId: projectWorkflowIdSchema,
  paymentRequestId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});
