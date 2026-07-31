import type { IntakeAnswers } from "./intake";

export type WorkflowFieldErrors = Record<string, string[] | undefined>;

export interface WorkflowActionState {
  readonly status: "idle" | "error";
  readonly message?: string;
  readonly fieldErrors?: WorkflowFieldErrors;
}

export const initialWorkflowActionState: WorkflowActionState = {
  status: "idle",
};

/**
 * The intake carries its submitted values back on failure.
 *
 * React resets an uncontrolled form once its action settles, so a rejected submission
 * that returns only messages leaves the fields to fall back to server state — text the
 * client never sees again. `values` is what the form re-seeds from.
 */
export interface IntakeActionState extends WorkflowActionState {
  readonly values?: {
    readonly answers: IntakeAnswers;
    readonly clientReply: string;
  };
}

export const initialIntakeActionState: IntakeActionState = {
  status: "idle",
};
