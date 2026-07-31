export type WorkflowFieldErrors = Record<string, string[] | undefined>;

export interface WorkflowActionState {
  readonly status: "idle" | "error";
  readonly message?: string;
  readonly fieldErrors?: WorkflowFieldErrors;
}

export const initialWorkflowActionState: WorkflowActionState = {
  status: "idle",
};
