/**
 * The commercial terms of the offer, in one place.
 *
 * These numbers appear in three surfaces — the pricing panel, the FAQ, and the
 * `priceRange` in structured data — and a visitor who sees two different figures for the
 * same thing stops believing either. So the amounts are declared once here and formatted
 * at the presentation edge with `formatCurrency` (AGENTS.md §7: explicit locale, explicit
 * ISO currency).
 *
 * These are entry rates set by the owner on 2026-07-27, deliberately below the surveyed
 * market. For context, so a later change is an informed one rather than a guess:
 *
 *   - Israeli senior freelance development rates sit at roughly ₪250–450/hour, and agency
 *     rates at ₪350–550/hour (market surveys, 2026).
 *   - A discovery-and-planning pass over one defined business process is 15–25 hours of
 *     work, which at those rates would be ₪4,500–8,750. `planningPriceCap` is set at
 *     ₪1,500, roughly a third of that.
 *   - Custom SMB systems are commonly quoted at ₪40,000–200,000. `buildFrom`/`buildTo`
 *     sit below that band.
 *
 * The gap is intentional: these are the rates of someone building a client list, where
 * winning the first engagements matters more than margin. The figures are easy to raise —
 * every surface reads them from here — but note that raising a *published* price is harder
 * than launching at one, and that planning revenue is refunded into the build, so the
 * planning fee is a deposit rather than income.
 */

/**
 * Discovery and planning for one process: a ceiling, not a floor and not an hourly rate.
 * A small process costs less; nothing costs more.
 *
 * A cap by owner decision on 2026-07-28, replacing the flat price set on 2026-07-27. A
 * ceiling keeps the property that made the flat price work — the visitor knows the worst
 * case before they call, so there is no open-ended number to be afraid of — while letting
 * a small process be quoted at what it is worth. What it must never become is "starting
 * from ₪1,500": a floor is the open-ended figure a sceptical buyer reads as evasion, which
 * is exactly what this wording avoids. Every surface therefore says *up to*, never *from*.
 *
 * The free initial discovery in the intro call is what keeps this honest: scope is roughly
 * known on both sides, and the exact figure is closed, before any work starts.
 */
export const planningPriceCap = 1_500;

/** The band most build projects land in, stated so a visitor can self-qualify. */
export const buildFrom = 10_000;
export const buildTo = 30_000;
