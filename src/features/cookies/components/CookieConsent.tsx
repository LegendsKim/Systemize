"use client";
// Required: manages consent choices, writes a first-party cookie, and opens inline settings.

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  allCookiePreferences,
  COOKIE_CONSENT_NAME,
  COOKIE_PREFERENCES_CHANGED_EVENT,
  COOKIE_SETTINGS_OPEN_EVENT,
  necessaryOnlyCookiePreferences,
  serializeCookiePreferences,
  type CookiePreferences,
} from "../cookie-preferences";
import type { CookieSettingsOpenDetail } from "./CookieSettingsLink";

interface CookieConsentProps {
  readonly initialPreferences: CookiePreferences | null;
  readonly revealDelayMs?: number;
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/**
 * A first-time visitor gets to see the page before the panel arrives. The footer
 * settings link still opens it immediately, and the delay never applies to a visitor
 * whose choice is already stored.
 */
export const COOKIE_CONSENT_REVEAL_DELAY_MS = 10_000;

const categories = [
  {
    key: "preferences",
    title: "העדפות וחוויית שימוש",
    description: "זוכרות מה בחרתם, כדי שלא תבחרו הכול מחדש בכל ביקור.",
  },
  {
    key: "analytics",
    title: "מדידה אנונימית",
    description: "מספרות לנו אילו עמודים עובדים, בלי לספר מי אתם.",
  },
  {
    key: "marketing",
    title: "שיווק מותאם",
    description: "מתאימות מסרים והצעות. כרגע אין באתר כלי שיווק פעיל.",
  },
] as const;

export function CookieConsent({
  initialPreferences,
  revealDelayMs = COOKIE_CONSENT_REVEAL_DELAY_MS,
}: CookieConsentProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(
    initialPreferences ?? necessaryOnlyCookiePreferences
  );
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLButtonElement | null>(null);
  const focusOnOpenRef = useRef(false);

  /*
   * The deps are the two values the schedule depends on, and neither changes after a
   * choice is committed — so the panel is never re-scheduled behind the visitor once
   * they have answered it.
   */
  useEffect(() => {
    if (initialPreferences !== null) return;

    const timer = window.setTimeout(() => setVisible(true), revealDelayMs);
    return () => window.clearTimeout(timer);
  }, [initialPreferences, revealDelayMs]);

  useEffect(() => {
    function openSettings(event: Event) {
      const customEvent = event as CustomEvent<CookieSettingsOpenDetail>;
      restoreFocusRef.current = customEvent.detail?.trigger ?? null;
      focusOnOpenRef.current = true;
      setCustomizing(true);
      setVisible(true);
    }

    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
    return () => window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, openSettings);
  }, []);

  useEffect(() => {
    if (!visible || !focusOnOpenRef.current) return;
    panelRef.current?.focus();
    focusOnOpenRef.current = false;
  }, [visible]);

  function commit(next: CookiePreferences) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_CONSENT_NAME}=${serializeCookiePreferences(
      next
    )}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

    setPreferences(next);
    setVisible(false);
    setCustomizing(false);
    window.dispatchEvent(
      new CustomEvent<CookiePreferences>(COOKIE_PREFERENCES_CHANGED_EVENT, {
        detail: next,
      })
    );
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }

  function toggle(key: keyof CookiePreferences) {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  }

  if (!visible) return null;

  return (
    <aside
      ref={panelRef}
      className={`cookie-consent${customizing ? " cookie-consent--customizing" : ""}`}
      aria-labelledby="cookie-consent-title"
      tabIndex={-1}
    >
      <div className="cookie-consent-header">
        <span className="cookie-consent-brand" aria-hidden="true">
          <Image
            src="/cookies/code-cookie-icon.png"
            width={56}
            height={56}
            alt=""
            sizes="56px"
          />
        </span>

        <div className="cookie-consent-copy">
          <p className="cookie-consent-kicker">SYSTEMIZE · COOKIES</p>
          <h2 id="cookie-consent-title">עוגיות. בלי פירורים מיותרים.</h2>
          {/*
           * Two ledes, one shown at a time by width. A phone gets the one-line version so
           * the panel stays a strip; anything wider gets the full sentence. Only one of
           * them is ever in the accessibility tree, because the other is `display: none`.
           */}
          <p className="cookie-consent-lede">
            ההכרחיות כבר בתנור, בלעדיהן האתר לא באמת עובד. כל השאר נכנסות לצנצנת רק
            אם הזמנתם אותן.
          </p>
          <p className="cookie-consent-lede cookie-consent-lede--compact">
            ההכרחיות כבר בתנור. כל השאר — רק אם הזמנתם.
          </p>
        </div>
      </div>

      {customizing && (
        <fieldset className="cookie-consent-options">
          <legend className="sr-only">בחירת סוגי עוגיות</legend>

          <label className="cookie-option cookie-option--locked">
            <span className="cookie-option-copy">
              <strong>עוגיות חיוניות</strong>
              <small>אבטחה, תפעול האתר ושמירת הבחירה שלכם.</small>
            </span>
            <input type="checkbox" checked disabled />
            <span className="cookie-switch" aria-hidden="true" />
          </label>

          {categories.map((category) => (
            <label className="cookie-option" key={category.key}>
              <span className="cookie-option-copy">
                <strong>{category.title}</strong>
                <small>{category.description}</small>
              </span>
              <input
                type="checkbox"
                checked={preferences[category.key]}
                onChange={() => toggle(category.key)}
              />
              <span className="cookie-switch" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
      )}

      <div className="cookie-consent-actions">
        {customizing ? (
          <button
            type="button"
            className="cookie-button cookie-button--primary"
            onClick={() => commit(preferences)}
          >
            שומרים את הבחירה
          </button>
        ) : (
          <>
            <button
              type="button"
              className="cookie-button cookie-button--primary"
              onClick={() => commit(allCookiePreferences)}
            >
              מאשרים וזורמים
            </button>
            <button
              type="button"
              className="cookie-button cookie-button--secondary"
              onClick={() => commit(necessaryOnlyCookiePreferences)}
            >
              רק ההכרחיות
            </button>
          </>
        )}

        <button
          type="button"
          className="cookie-button cookie-button--text"
          onClick={() => setCustomizing((current) => !current)}
        >
          {customizing ? "חזרה" : "בוחרים בעצמכם"}
        </button>
      </div>

      {/* The lede is dropped on a phone so the line collapses to the link alone. */}
      <p className="cookie-consent-privacy">
        <span className="cookie-consent-privacy-lede">
          בלי אותיות קטנות ובלי צנצנת נסתרת.{" "}
        </span>
        <Link href="/privacy">למדיניות הפרטיות</Link>
      </p>
    </aside>
  );
}
