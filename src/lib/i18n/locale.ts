/**
 * Locale configuration for the Systemize marketing site.
 *
 * Per AGENTS.client.md §2 this project ships a single locale, Hebrew, rendered
 * right-to-left. Because there is exactly one locale, routes carry no locale segment.
 */

export const supportedLocales = ["he"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "he";

/** IANA timezone used for every presentation-edge date and time format. */
export const timeZone = "Asia/Jerusalem";

/** ISO 4217 currency used for every money format. */
export const currency = "ILS";

/** BCP 47 tag passed to `Intl` formatters. */
export const formatLocale = "he-IL";

/**
 * Returns the text direction for the given locale.
 *
 * Uses the standard RTL script list so that adding a locale later needs no change here.
 */
export function getDirection(locale: Locale): "rtl" | "ltr" {
  const rtlLocales: ReadonlySet<string> = new Set(["he", "ar", "fa", "ur"]);
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}

/**
 * Returns a BCP 47 language tag suitable for the `lang` attribute.
 */
export function getHtmlLang(locale: Locale): string {
  return locale;
}
