export const COOKIE_CONSENT_NAME = "systemize_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_SETTINGS_OPEN_EVENT = "systemize:open-cookie-settings";
export const COOKIE_PREFERENCES_CHANGED_EVENT = "systemize:cookie-preferences-changed";

export interface CookiePreferences {
  readonly preferences: boolean;
  readonly analytics: boolean;
  readonly marketing: boolean;
}
export const necessaryOnlyCookiePreferences: CookiePreferences = {
  preferences: false,
  analytics: false,
  marketing: false,
};

export const allCookiePreferences: CookiePreferences = {
  preferences: true,
  analytics: true,
  marketing: true,
};

/**
 * A deliberately small, versioned first-party cookie value. Optional integrations can
 * read the parsed preferences, but must never infer consent from a missing or malformed
 * value.
 */
export function serializeCookiePreferences(preferences: CookiePreferences): string {
  return [
    `v${COOKIE_CONSENT_VERSION}`,
    `p${Number(preferences.preferences)}`,
    `a${Number(preferences.analytics)}`,
    `m${Number(preferences.marketing)}`,
  ].join(".");
}

export function parseCookiePreferences(value: string | undefined): CookiePreferences | null {
  if (!value) return null;

  const match = /^v1\.p([01])\.a([01])\.m([01])$/.exec(value);
  if (!match) return null;

  return {
    preferences: match[1] === "1",
    analytics: match[2] === "1",
    marketing: match[3] === "1",
  };
}
