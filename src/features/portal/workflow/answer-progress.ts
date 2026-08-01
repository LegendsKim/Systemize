import { intakeMinimumAnswerLength } from "./schemas";

export type AnswerProgressTone = "short" | "ok" | "near-limit";

export interface AnswerProgress {
  readonly tone: AnswerProgressTone;
  readonly label: string;
}

/**
 * What the counter under a field says.
 *
 * A required field that is still too short states the target rather than a rule, because
 * the complaint it answers was never "the minimum is too high" — it was "I could not see
 * how much was expected until it rejected me".
 */
export function describeAnswerProgress(
  length: number,
  required: boolean,
  maximum: number
): AnswerProgress {
  if (required && length < intakeMinimumAnswerLength) {
    return {
      tone: "short",
      label:
        length === 0
          ? `לפחות ${intakeMinimumAnswerLength} תווים`
          : `${length} מתוך ${intakeMinimumAnswerLength} תווים`,
    };
  }

  if (length > maximum - 200) {
    return {
      tone: "near-limit",
      label: `${length} מתוך ${maximum} תווים`,
    };
  }

  return { tone: "ok", label: `${length} תווים` };
}
