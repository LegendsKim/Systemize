/**
 * The two loading sequences the gate plays.
 *
 * Kept as plain data, separate from the component, for two reasons: the timing is the
 * part worth testing (a sequence that outlives its welcome is worse than no sequence at
 * all), and the copy is the part most likely to be edited by someone who should not have
 * to read React to do it.
 *
 * The tone is deliberately dry rather than jokey. The audience is a paying client, humour
 * earns its place only if it sounds like competence relaxing, never like the product
 * goofing around.
 */

export interface BootStep {
  /** The work being reported. Announced to assistive technology. */
  readonly title: string;
  /** The aside underneath it. Where the personality lives. */
  readonly aside: string;
  /** How long this step stays current, in milliseconds. */
  readonly durationMs: number;
}

/** Emitted once the sign-in splash has fully left the DOM. */
export const gateSplashCompleteEvent = "systemize:gate-splash-complete";

/**
 * Shown on arrival at the sign-in screen, before anything is asked of the visitor.
 *
 * Long enough for the brand beat and status copy to register, while a skip control and
 * dismissal on any click or key keep it from delaying someone who came to sign in.
 */
export const gateSplashSteps: readonly BootStep[] = [
  {
    title: "מכינים כניסה מאובטחת",
    aside: "בלי סיסמאות, בלי טפסים, בלי קוד ב-SMS.",
    durationMs: 1_700,
  },
  {
    title: "מוודאים שהכול מוכן",
    aside: "הגישה נשארת פרטית ומחוברת רק לפרויקט שלך.",
    durationMs: 1_600,
  },
  {
    title: "אפשר להיכנס",
    aside: "אפשר להיכנס.",
    durationMs: 1_400,
  },
] as const;

/** Played once, right after a successful sign-in, while the portal is being assembled. */
export const portalBootSteps: readonly BootStep[] = [
  {
    title: "מאמתים זהות",
    aside: "Google אישרה שזה אתה. גם אנחנו משוכנעים.",
    durationMs: 900,
  },
  {
    title: "טוענים את מצב הפרויקט",
    aside: "כל השלבים, הגרסאות והתאריכים, במשיכה אחת.",
    durationMs: 950,
  },
  {
    title: "מסדרים מסמכים",
    aside: "לפי היגיון, לא לפי סדר הגעה.",
    durationMs: 900,
  },
  {
    title: "מסנכרנים החלטות ופעולות",
    aside: "כדי שלא תצטרך לחפש את זה בוואטסאפ.",
    durationMs: 950,
  },
  {
    title: "מיישרים פיקסלים",
    aside: "אף אחד לא ביקש. אנחנו לא מצליחים להתאפק.",
    durationMs: 850,
  },
  {
    title: "הכול מוכן",
    aside: "האזור האישי שלך פתוח.",
    durationMs: 700,
  },
] as const;

/** How long an overlay takes to clear once its last step lands. */
export const bootExitMs = 600;

/**
 * Milliseconds from mount until each step becomes the current one, plus a final entry
 * holding the total.
 *
 * The component schedules one timer per entry instead of running an interval, so a step
 * can be given its own weight without the others inheriting it.
 */
export function bootStepOffsets(steps: readonly BootStep[]): readonly number[] {
  return steps.reduce<number[]>(
    (offsets, step, index) => {
      offsets.push((offsets[index] ?? 0) + step.durationMs);
      return offsets;
    },
    [0]
  );
}

/** Total run time of a sequence, excluding the exit transition. */
export function bootDuration(steps: readonly BootStep[]): number {
  return steps.reduce((total, step) => total + step.durationMs, 0);
}

/**
 * Completion, as a percentage, once `index` is the current step.
 *
 * The rail fills to the *end* of the current step rather than its start, so the bar is
 * always moving toward something rather than sitting still while text changes.
 */
export function bootProgressPercent(
  index: number,
  steps: readonly BootStep[]
): number {
  const clamped = Math.min(Math.max(index, 0), steps.length - 1);
  return Math.round(((clamped + 1) / steps.length) * 100);
}
