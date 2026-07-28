import { currency, formatLocale } from "./locale";

/**
 * Shared `Intl` formatters.
 *
 * Instances are created once at module scope because constructing an `Intl` formatter is
 * comparatively expensive and these two configurations are the only ones the site uses.
 * This is a fixed, bounded set, not a cache that can grow.
 *
 * Both formatters are given an explicit locale and, for money, an explicit ISO 4217
 * currency code, as required by AGENTS.md §7. Neither reads ambient locale or timezone,
 * so server and client produce the same initial render.
 */

const currencyFormatter = new Intl.NumberFormat(formatLocale, {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(formatLocale, {
  maximumFractionDigits: 0,
});

/**
 * Formats a monetary amount in ILS, rounded to whole shekels.
 *
 * Non-finite input formats as zero rather than rendering `NaN ₪` to a visitor.
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

/**
 * Formats a plain number with Hebrew digit grouping.
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}
