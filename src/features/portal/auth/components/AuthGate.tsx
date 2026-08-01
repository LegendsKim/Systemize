import { SystemizeLockup } from "@/components/brand/SystemizeLockup";
import { GateSplash } from "@/features/portal/components/GateSplash";
import { contact } from "@/lib/site-config";

interface AuthGateProps {
  /** id of the heading that names the action column. */
  readonly labelledBy: string;
  /** The action column: heading, copy, and the sign-in form. */
  readonly children: React.ReactNode;
  /** The mint panel. Omitted on the dead-end screens, which get a single column. */
  readonly aside?: React.ReactNode;
  /**
   * Whether to open with the short loading beat. On by default, off on the error screens,
   * where a visitor is already mid-problem and owes us no patience.
   */
  readonly splash?: boolean;
}

/**
 * The entrance shell shared by /login, /invite/[token] and the auth error screens.
 *
 * Two columns of deliberately different weight. The action column is paper, quiet, and
 * holds exactly one thing to do. The second is mint: the same topographic field the
 * marketing hero is built on, a slow drift of the brand turquoise, and a connector line
 * that scans down the three promises. That difference is doing real work — a card
 * floating on a background of nearly its own colour, which is what the previous screen
 * was, gives the eye nothing to rank.
 *
 * On a phone the second column is dropped entirely rather than stacked; see the phone
 * section of portal-gate.css for why.
 *
 * Server Component. Every moving part here is CSS, so the entrance costs no JavaScript
 * beyond the submit button's pending state.
 */
export function AuthGate({
  labelledBy,
  children,
  aside,
  splash = true,
}: AuthGateProps) {
  const supportHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    "היי, אני מנסה להיכנס לאזור האישי ונתקלתי בבעיה"
  )}`;

  return (
    <main id="main-content" className="auth-gate">
      {splash && <GateSplash />}
      <div className="auth-gate-field" aria-hidden="true" />
      <section
        className={`auth-gate-shell${aside ? "" : " auth-gate-shell-single"}`}
        aria-labelledby={labelledBy}
      >
        <div className="auth-gate-action">{children}</div>
        {aside ? <aside className="auth-gate-panel">{aside}</aside> : null}
      </section>
      <p className="auth-gate-footer">
        <a href="/privacy">מדיניות פרטיות</a>
        <span aria-hidden="true">·</span>
        <a href={supportHref} target="_blank" rel="noopener noreferrer">
          נתקלת בבעיה בכניסה?
        </a>
      </p>
    </main>
  );
}

/**
 * The brand lockup above the heading.
 *
 * The same mark-and-name pair the site header carries, rather than the mark alone in a
 * coloured tile: a visitor arriving from the marketing site should recognise the logo
 * they just left, and a sign-in screen is the one place where "this is the same company"
 * is load-bearing rather than decorative. It assembles on arrival, the two halves
 * converging into one lockup.
 */
export function AuthGateMark() {
  return (
    <SystemizeLockup className="auth-gate-lockup" animated />
  );
}

interface AuthTrustBadgesProps {
  readonly items: readonly string[];
}

/**
 * The row of small assurances directly under the sign-in button.
 *
 * Placed after the action rather than before it on purpose: they are the answer to the
 * hesitation that arrives at the moment of clicking, not a preamble to be read first.
 */
export function AuthTrustBadges({ items }: AuthTrustBadgesProps) {
  return (
    <ul className="auth-trust">
      {items.map((item) => (
        <li key={item}>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M8 1.5 13.5 4v4.2c0 3-2.2 5.4-5.5 6.3-3.3-.9-5.5-3.3-5.5-6.3V4L8 1.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="m5.6 8.1 1.7 1.7 3.2-3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}

export interface AuthSignal {
  readonly title: string;
  readonly detail: string;
}

interface AuthSignalListProps {
  readonly items: readonly AuthSignal[];
}

/**
 * The three promises on the ink panel, drawn as nodes on a single line.
 *
 * The connector is one pseudo-element carrying two stacked gradients, the static line and
 * a soft highlight whose background-position is animated. One painted layer travelling,
 * no geometry recalculated per frame, and it degrades to a plain line under
 * `prefers-reduced-motion` because the global rule collapses the animation to its final
 * frame.
 */
export function AuthSignalList({ items }: AuthSignalListProps) {
  return (
    <ul className="auth-signals">
      {items.map((item) => (
        <li key={item.title}>
          <span className="auth-signal-node" aria-hidden="true" />
          <span className="auth-signal-body">
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
