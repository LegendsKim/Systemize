import { z } from "zod";
import {
  intakeFieldNames,
  type IntakeAnswers,
  type IntakeFieldName,
} from "./intake";

const answerSchema = z.string().trim().max(5000, "התשובה ארוכה מדי.");

/**
 * The floor for a required answer, in characters.
 *
 * Low on purpose: it exists to stop "כן" and an accidental empty submit, not to force
 * anyone to write an essay. The same number drives the counter under every field, so the
 * client is told the target before they hit send rather than after.
 */
export const intakeMinimumAnswerLength = 10;

export const intakeMaximumAnswerLength = 5000;

export const intakeReplyMaximumLength = 2000;

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

export interface ParsedIntakeForm {
  readonly answers: IntakeAnswers;
  readonly clientReply: string;
  readonly fieldErrors: Record<string, string[] | undefined>;
}

/**
 * Always returns what the person typed, valid or not.
 *
 * The earlier version returned either answers or errors. That made the failure path throw
 * away ten minutes of writing: the action returned only messages, React reset the
 * uncontrolled form, and the fields fell back to the last values the server had — which,
 * validation having failed, were the ones from before the session. Echoing the submitted
 * text back is what lets the screen redraw with the work still in it.
 */
export function parseIntakeForm(
  formData: FormData,
  submit: boolean
): ParsedIntakeForm {
  const answers = {} as IntakeAnswers;
  const fieldErrors: Record<string, string[] | undefined> = {};

  for (const name of intakeFieldNames) {
    const rawValue = formData.get(name);
    const raw = typeof rawValue === "string" ? rawValue : "";
    const result = answerSchema.safeParse(raw);

    if (!result.success) {
      fieldErrors[name] = result.error.issues.map((issue) => issue.message);
      answers[name] = raw.slice(0, intakeMaximumAnswerLength);
      continue;
    }

    answers[name] = result.data;
    if (
      submit &&
      requiredOnSubmit.has(name) &&
      result.data.length < intakeMinimumAnswerLength
    ) {
      const missing = intakeMinimumAnswerLength - result.data.length;
      fieldErrors[name] = [
        `חסרים עוד ${missing} תווים כדי שנוכל לשלוח את התשובה הזו.`,
      ];
    }
  }

  const rawReply = formData.get("clientReply");
  const clientReply =
    typeof rawReply === "string"
      ? rawReply.trim().slice(0, intakeReplyMaximumLength)
      : "";

  return { answers, clientReply, fieldErrors };
}

export function hasIntakeFieldErrors(parsed: ParsedIntakeForm): boolean {
  return Object.keys(parsed.fieldErrors).length > 0;
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
