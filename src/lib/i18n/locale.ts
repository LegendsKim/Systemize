/**
 * Supported locales for the boilerplate.
 *
 * Client projects configure the actual locale set via AGENTS.client.md.
 * The boilerplate ships with Hebrew (RTL) and English (LTR) as representative defaults.
 */
export const supportedLocales = ["he", "en"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

/**
 * Returns the text direction for the given locale.
 *
 * Uses the standard RTL script list. Extend as needed for additional locales.
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
