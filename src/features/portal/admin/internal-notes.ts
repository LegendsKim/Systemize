import { z } from "zod";
import type { ProjectReadiness } from "@/lib/supabase/types";

/**
 * The operator's private read on an engagement.
 *
 * Every field is optional. Notes are written in the ten minutes after a call, in
 * whatever order things come back — a form that refuses to save until all five boxes
 * are full is a form that gets abandoned, and an abandoned note is worth nothing.
 */

/*
 * `satisfies` binds this list to the database enum: adding a value in one place and not
 * the other stops the build rather than producing a radio the column will reject.
 */
export const projectReadinessValues = [
  "unknown",
  "low",
  "medium",
  "high",
] as const satisfies readonly ProjectReadiness[];

export type { ProjectReadiness };

export const projectReadinessLabels: Record<ProjectReadiness, string> = {
  unknown: "טרם נקבע",
  low: "בשלות נמוכה",
  medium: "בשלות בינונית",
  high: "בשלות גבוהה",
};

export const projectReadinessHints: Record<ProjectReadiness, string> = {
  unknown: "עדיין אין מספיק מידע כדי להעריך.",
  low: "מתעניין, אך רחוק מהחלטה או מתקציב.",
  medium: "יש כוונה אמיתית, חסרים תקציב, סמכות או תזמון.",
  high: "מוכן להתקדם: יש צורך, סמכות ותקציב.",
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "הטקסט ארוך מדי.")
    .default("");

export const internalNotesFormSchema = z.object({
  projectId: z.string().uuid(),
  impression: optionalText(4_000),
  budgetSignal: optionalText(2_000),
  readiness: z.enum(projectReadinessValues).default("unknown"),
  risks: optionalText(4_000),
  flags: optionalText(4_000),
});

export type InternalNotesValues = z.output<typeof internalNotesFormSchema>;

export interface InternalNotesDefaults {
  readonly impression: string;
  readonly budgetSignal: string;
  readonly readiness: ProjectReadiness;
  readonly risks: string;
  readonly flags: string;
}

export const emptyInternalNotes: InternalNotesDefaults = {
  impression: "",
  budgetSignal: "",
  readiness: "unknown",
  risks: "",
  flags: "",
};

export const internalNotesFields = [
  {
    name: "impression",
    label: "התרשמות מהשיחה",
    hint: "מי היה בשיחה, איך הם מדברים על הבעיה, ומה לא נאמר במפורש.",
    rows: 5,
    maxLength: 4_000,
  },
  {
    name: "budgetSignal",
    label: "אינדיקציית תקציב",
    hint: "מה נאמר על תקציב, ומה הפער בינו לבין ההיקף שהם מתארים.",
    rows: 3,
    maxLength: 2_000,
  },
  {
    name: "risks",
    label: "סיכונים",
    hint: "תלויות, מערכות קיימות, ציפיות ללוח זמנים, מי מחליט בפועל.",
    rows: 4,
    maxLength: 4_000,
  },
  {
    name: "flags",
    label: "דגלים אדומים",
    hint: "סימנים שכדאי לא להתקדם, או להתקדם רק בתנאים מסוימים.",
    rows: 4,
    maxLength: 4_000,
  },
] as const satisfies readonly {
  name: keyof Omit<InternalNotesDefaults, "readiness">;
  label: string;
  hint: string;
  rows: number;
  maxLength: number;
}[];

/** Whether anything was actually recorded, for the "not yet written" state. */
export function hasInternalNotes(notes: InternalNotesDefaults): boolean {
  return (
    notes.readiness !== "unknown" ||
    [notes.impression, notes.budgetSignal, notes.risks, notes.flags].some(
      (value) => value.trim() !== ""
    )
  );
}
