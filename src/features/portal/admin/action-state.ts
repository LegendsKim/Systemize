export type AdminFieldErrors = Record<string, string[] | undefined>;

export interface AdminActionState {
  readonly status: "idle" | "error" | "success";
  readonly message?: string;
  readonly fieldErrors?: AdminFieldErrors;
  readonly shareUrl?: string;
}

export const initialAdminActionState: AdminActionState = { status: "idle" };
