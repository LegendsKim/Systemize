import type { ProjectStage } from "@/lib/supabase/types";

export const projectStageLabels: Record<ProjectStage, string> = {
  lead: "ליד חדש",
  intro_call_scheduled: "שיחת היכרות",
  initial_summary_preparation: "הכנת סיכום ראשוני",
  discovery_offer_awaiting_client: "הצעת אפיון ממתינה ללקוח",
  discovery_payment_pending: "ממתין לתשלום עבור אפיון",
  full_discovery_and_planning: "אפיון ותכנון מלא",
  solution_options_preparation: "הכנת חלופות פתרון",
  proposal_and_contract_awaiting_client: "הצעה וחוזה ממתינים ללקוח",
  initial_payment_pending: "ממתין לתשלום ראשוני",
  delivery: "פיתוח וביצוע",
  client_review: "בדיקת לקוח",
  rollout: "הטמעה",
  support: "ליווי ותמיכה",
  completed: "הושלם",
  cancelled: "בוטל",
};

/** Client-facing wording avoids exposing internal sales-pipeline terminology. */
export const clientProjectStageLabels: Record<ProjectStage, string> = {
  ...projectStageLabels,
  lead: "שלב היכרות ראשוני",
  discovery_offer_awaiting_client: "הצעת אפיון ממתינה לאישור שלך",
  proposal_and_contract_awaiting_client: "הצעה וחוזה ממתינים לאישור שלך",
  client_review: "הבדיקה שלך",
};
