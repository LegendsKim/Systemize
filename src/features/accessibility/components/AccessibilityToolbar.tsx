"use client";
// Required: the toolbar holds the visitor's settings, persists them, and opens a dialog.

import { useCallback, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { a11yLevelCopy, a11yToggleCopy, a11yToolbar } from "../a11y-content";
import {
  MAX_LEVEL,
  defaultA11ySettings,
  isDefaultSettings,
  levelKeys,
  toggleKeys,
  type A11ySettings,
} from "../a11y-settings";
import {
  getA11ySettingsServerSnapshot,
  getA11ySettingsSnapshot,
  subscribeToA11ySettings,
  writeA11ySettings,
} from "../a11y-store";

/**
 * The accessibility toolbar: a floating trigger and the panel it opens.
 *
 * Behaviour worth knowing before changing anything here:
 *
 *   - **First render is always the defaults.** Saved settings live in `localStorage`,
 *     which the server cannot read, so rendering them would be a hydration mismatch
 *     (AGENTS.md §3). The attributes are restored before paint by the nonce'd script in the
 *     root layout, and the control values come from `a11y-store` through
 *     `useSyncExternalStore`, which renders the server snapshot through hydration and only
 *     then reads storage. The visitor never sees the unstyled page; React never renders a
 *     value it could not have rendered on the server.
 *
 *   - **The DOM mutation is deliberate and scoped.** Settings are written as attributes on
 *     `<html>`, which React owns. That is the documented integration AGENTS.md §3 allows:
 *     it is confined to attributes this feature alone defines, and no React-rendered
 *     content depends on them, so React never fights the toolbar for the same DOM.
 *
 *   - **Levels are radios, not a cycling button.** A tile that steps 0→1→2→3→0 cannot be
 *     moved backwards by keyboard and announces nothing useful. A radio group states the
 *     options, the current value, and lets any of them be reached directly.
 */
export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  /** Announced after each change. Empty on first render so nothing is read on load. */
  const [announcement, setAnnouncement] = useState("");
  const groupId = useId();

  const settings = useSyncExternalStore(
    subscribeToA11ySettings,
    getA11ySettingsSnapshot,
    getA11ySettingsServerSnapshot
  );

  const commit = useCallback((next: A11ySettings, message: string) => {
    writeA11ySettings(next);
    setAnnouncement(message);
  }, []);

  const toggle = useCallback(
    (key: (typeof toggleKeys)[number]) => {
      const nextValue = !settings[key];
      commit(
        { ...settings, [key]: nextValue },
        `${a11yToggleCopy[key].label}: ${nextValue ? a11yToolbar.on : a11yToolbar.off}`
      );
    },
    [commit, settings]
  );

  const setLevel = useCallback(
    (key: (typeof levelKeys)[number], level: number) => {
      commit(
        { ...settings, [key]: level },
        `${a11yLevelCopy[key].label}: ${a11yToolbar.levelNames[level]}`
      );
    },
    [commit, settings]
  );

  const reset = useCallback(() => {
    commit(defaultA11ySettings, a11yToolbar.resetAnnouncement);
  }, [commit]);

  return (
    <>
      <button
        type="button"
        className="a11y-trigger"
        aria-label={a11yToolbar.openLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <AccessibilityIcon />
      </button>

      {/*
       * The live region lives outside the dialog on purpose. A modal `<dialog>` makes the
       * rest of the page inert, and a status region inside a dialog that is then closed
       * stops being announced mid-sentence.
       */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={a11yToolbar.title}
        description={a11yToolbar.description}
        className="a11y-dialog"
      >
        <div className="a11y-panel">
          <section aria-labelledby={`${groupId}-levels`}>
            <h3 className="a11y-group-heading" id={`${groupId}-levels`}>
              {a11yToolbar.levelsHeading}
            </h3>

            <div className="a11y-levels">
              {levelKeys.map((key) => (
                <fieldset key={key} className="a11y-level">
                  <legend className="a11y-level-legend">
                    <span className="a11y-level-name">
                      {a11yLevelCopy[key].label}
                      {/* The radios already carry the value; this is a glance-readable
                          echo of it, so it stays out of the accessibility tree. */}
                      <span className="a11y-level-meter" aria-hidden="true">
                        {settings[key]}/{MAX_LEVEL}
                      </span>
                    </span>
                    <span className="a11y-hint">{a11yLevelCopy[key].hint}</span>
                  </legend>

                  <div className="a11y-level-options">
                    {Array.from({ length: MAX_LEVEL + 1 }, (_, level) => (
                      <label className="a11y-level-option" key={level}>
                        <input
                          type="radio"
                          name={`${groupId}-${key}`}
                          value={level}
                          checked={settings[key] === level}
                          onChange={() => setLevel(key, level)}
                        />
                        <span>{a11yToolbar.levelNames[level]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>

          <section aria-labelledby={`${groupId}-toggles`}>
            <h3 className="a11y-group-heading" id={`${groupId}-toggles`}>
              {a11yToolbar.togglesHeading}
            </h3>

            <ul className="a11y-toggles">
              {toggleKeys.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    className="a11y-toggle"
                    aria-pressed={settings[key]}
                    onClick={() => toggle(key)}
                  >
                    <span className="a11y-toggle-label">
                      {a11yToggleCopy[key].label}
                    </span>
                    <span className="a11y-hint">{a11yToggleCopy[key].hint}</span>
                    {/*
                     * A literal ON/OFF word, not a coloured dot: state must not be carried
                     * by colour alone. `aria-pressed` on the button is the programmatic
                     * source, so this is hidden from assistive tech to avoid saying it
                     * twice.
                     */}
                    <span className="a11y-toggle-state" aria-hidden="true">
                      {settings[key] ? a11yToolbar.stateOn : a11yToolbar.stateOff}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="a11y-footer">
            <button
              type="button"
              className="a11y-reset"
              onClick={reset}
              disabled={isDefaultSettings(settings)}
            >
              {a11yToolbar.reset}
            </button>

            <Link className="a11y-statement-link" href="/accessibility">
              {a11yToolbar.statementLink}
            </Link>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** The international symbol of access, drawn rather than set as a glyph. */
function AccessibilityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="4.2" r="2.1" />
      <path d="M20 7.4a1 1 0 0 0-1.2-.75l-4.32.96a10.4 10.4 0 0 1-4.96 0L5.2 6.65A1 1 0 1 0 4.78 8.6l4.03.9v3.06l-2.2 6.9a1 1 0 0 0 1.9.6l1.96-6.14h1.06l1.96 6.14a1 1 0 1 0 1.9-.6l-2.2-6.9V9.5l4.03-.9A1 1 0 0 0 20 7.4Z" />
    </svg>
  );
}
