import type { PaymentRequestStatus } from "@/lib/supabase/types";

export type WorkflowStepState = "complete" | "current" | "upcoming";

interface PaymentStepInput {
  readonly status: PaymentRequestStatus;
}

export interface PaymentStepPresentation {
  readonly state: WorkflowStepState;
  readonly detail: string;
}

/** Keeps the commercial gate complete after its pending request becomes paid. */
export function derivePaymentStep(
  payments: readonly PaymentStepInput[]
): PaymentStepPresentation {
  if (payments.some((payment) => payment.status === "paid")) {
    return { state: "complete", detail: "שולם" };
  }

  if (payments.some((payment) => payment.status === "pending")) {
    return { state: "current", detail: "ממתין ללקוח" };
  }

  return { state: "upcoming", detail: "טרם פורסם" };
}
