"use client";
// Required: opens the cookie preferences panel from the footer.

import type { MouseEvent } from "react";
import { COOKIE_SETTINGS_OPEN_EVENT } from "../cookie-preferences";

export interface CookieSettingsOpenDetail {
  readonly trigger: HTMLButtonElement;
}
export function CookieSettingsLink() {
  function openSettings(event: MouseEvent<HTMLButtonElement>) {
    window.dispatchEvent(
      new CustomEvent<CookieSettingsOpenDetail>(COOKIE_SETTINGS_OPEN_EVENT, {
        detail: { trigger: event.currentTarget },
      })
    );
  }

  return (
    <button type="button" className="site-footer-link cookie-settings-link" onClick={openSettings}>
      הגדרות עוגיות
    </button>
  );
}
