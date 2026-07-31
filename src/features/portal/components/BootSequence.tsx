"use client";
// Required: a timed loading sequence. Timers, a media query and Escape handling are all
// browser-only, and the overlay must remove itself without a round trip to the server.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { SystemizeLockup } from "@/components/brand/SystemizeLockup";
import {
  bootDuration,
  bootExitMs,
  bootProgressPercent,
  bootStepOffsets,
  type BootStep,
} from "@/features/portal/boot-sequence";

interface BootSequenceProps {
  /** The sequence to play. */
  readonly steps: readonly BootStep[];
  /** Heading while the sequence runs. */
  readonly title: string;
  /** Heading once the last step lands. */
  readonly completeTitle: string;
  /** Label on the skip control. */
  readonly skipLabel: string;
  /**
   * A search parameter to drop once the sequence is over, so a refresh does not replay
   * it. Only the post-sign-in overlay uses one.
   */
  readonly clearParam?: string;
}

type BootPhase = "running" | "leaving" | "done";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The motion preference, read the way React wants an external system read.
 *
 * The obvious alternative, `matchMedia` inside an effect writing to state, is both a
 * cascading render and a rule this repository lints against. `useSyncExternalStore` also
 * gives the honest server snapshot, `false`, so the first HTML is deterministic and a
 * visitor who prefers reduced motion simply gets the short form once hydrated.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false
  );
}

/**
 * A full-screen loading overlay that reports what it is doing.
 *
 * Rendered by the server, so it is part of the very first HTML and there is no flash of
 * the page underneath before it appears. Nothing about it is read from browser storage,
 * which is what keeps the first server and client render identical (AGENTS.md §3).
 *
 * It is skippable from the first frame, dismissed by Escape or by clicking anywhere, and
 * collapses to a single short beat under `prefers-reduced-motion`. A splash a visitor
 * cannot leave is not charming, it is a hostage situation.
 */
export function BootSequence({
  steps,
  title,
  completeTitle,
  skipLabel,
  clearParam,
}: BootSequenceProps) {
  const [phase, setPhase] = useState<BootPhase>("running");
  const [index, setIndex] = useState(0);
  const skipRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const offsets = useMemo(() => bootStepOffsets(steps), [steps]);
  const duration = useMemo(() => bootDuration(steps), [steps]);

  // With motion suppressed the step-by-step reveal has nothing left to reveal, so the
  // overlay states its conclusion and leaves. Derived rather than assigned, so no effect
  // has to write to state to say it.
  const activeIndex = reducedMotion ? steps.length - 1 : index;

  const finish = useCallback(() => {
    setPhase((current) => (current === "running" ? "leaving" : current));
  }, []);

  // The sequence itself. Every timer is cleared on the way out, including when the
  // visitor skips, which moves the phase and re-runs this effect's cleanup.
  useEffect(() => {
    if (phase !== "running") return;

    if (reducedMotion) {
      const timer = window.setTimeout(finish, 800);
      return () => window.clearTimeout(timer);
    }

    const timers = steps
      .slice(1)
      .map((_, position) =>
        window.setTimeout(() => setIndex(position + 1), offsets[position + 1] ?? 0)
      );
    timers.push(window.setTimeout(finish, duration));

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [phase, finish, reducedMotion, steps, offsets, duration]);

  // The exit transition, then unmount.
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), bootExitMs);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Once it is over the parameter has done its job. Dropping it with the History API
  // rather than a router navigation keeps this a purely client-side tidy-up: the page
  // underneath is already rendered and must not be re-fetched.
  useEffect(() => {
    if (phase !== "done" || !clearParam) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(clearParam)) return;
    url.searchParams.delete(clearParam);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [phase, clearParam]);

  // The overlay covers the page, so the page behind it must not scroll underneath.
  // `document.body` is not part of the React tree, and the style is removed on unmount.
  useEffect(() => {
    if (phase === "done") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  // Skip is the only control, so containing focus is a matter of refusing to hand Tab
  // anywhere else. Escape leaves, as any modal surface must, and so does any other key:
  // someone who has started typing is telling us they are done watching.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Tab") {
        event.preventDefault();
        skipRef.current?.focus();
        return;
      }
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        finish();
      }
    },
    [finish]
  );

  if (phase === "done") return null;

  const current = steps[activeIndex] ?? steps[steps.length - 1]!;
  const isLast = activeIndex === steps.length - 1;

  return (
    <div
      className="boot-screen"
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={handleKeyDown}
      onClick={finish}
    >
      <div className="boot-field" aria-hidden="true" />
      <div className="boot-inner">
        <SystemizeLockup className="boot-lockup" animated />
        <p className="auth-eyebrow">האזור האישי</p>
        <h2 className="boot-title">{isLast ? completeTitle : title}</h2>

        <ol className="boot-steps">
          {steps.map((step, position) => (
            <li
              key={step.title}
              // On the final step everything is finished, including the final step, so
              // it takes a tick rather than a spinner that will never resolve.
              data-state={
                position < activeIndex || isLast
                  ? "done"
                  : position === activeIndex
                    ? "active"
                    : "pending"
              }
            >
              <span className="boot-step-node" aria-hidden="true" />
              {step.title}
            </li>
          ))}
        </ol>

        <div className="boot-rail" aria-hidden="true">
          <span style={{ inlineSize: `${bootProgressPercent(activeIndex, steps)}%` }} />
        </div>

        <p className="boot-aside" role="status">
          {current.aside}
        </p>

        <button
          ref={skipRef}
          type="button"
          className="boot-skip"
          onClick={finish}
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
