import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  COOKIE_CONSENT_REVEAL_DELAY_MS,
  CookieConsent,
} from "../components/CookieConsent";
import { CookieSettingsLink } from "../components/CookieSettingsLink";
import {
  COOKIE_CONSENT_NAME,
  necessaryOnlyCookiePreferences,
  parseCookiePreferences,
  serializeCookiePreferences,
} from "../cookie-preferences";

const HEADING = "עוגיות. בלי פירורים מיותרים.";

beforeEach(() => {
  document.cookie = `${COOKIE_CONSENT_NAME}=; Path=/; Max-Age=0`;
});
describe("cookie preference value", () => {
  it("round-trips a valid versioned preference value", () => {
    const value = serializeCookiePreferences({
      preferences: true,
      analytics: false,
      marketing: true,
    });

    expect(parseCookiePreferences(value)).toEqual({
      preferences: true,
      analytics: false,
      marketing: true,
    });
  });

  it("treats missing, malformed, and unknown-version values as no consent", () => {
    expect(parseCookiePreferences(undefined)).toBeNull();
    expect(parseCookiePreferences("yes-to-everything")).toBeNull();
    expect(parseCookiePreferences("v2.p1.a1.m1")).toBeNull();
  });
});

describe("CookieConsent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Mirrors the delay a first-time visitor waits before the panel appears. */
  function revealPanel() {
    act(() => {
      vi.advanceTimersByTime(COOKIE_CONSENT_REVEAL_DELAY_MS);
    });
  }

  it("stays out of the way until the reveal delay has passed", () => {
    render(<CookieConsent initialPreferences={null} />);

    expect(screen.queryByRole("heading", { name: HEADING })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(COOKIE_CONSENT_REVEAL_DELAY_MS - 1);
    });
    expect(screen.queryByRole("heading", { name: HEADING })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole("heading", { name: HEADING })).toBeVisible();
  });

  it("shows a compact first-visit choice with a privacy link", () => {
    render(<CookieConsent initialPreferences={null} />);
    revealPanel();

    expect(screen.getByRole("heading", { name: HEADING })).toBeVisible();
    expect(screen.getByRole("link", { name: "למדיניות הפרטיות" })).toHaveAttribute(
      "href",
      "/privacy"
    );
    expect(screen.queryByRole("group", { name: "בחירת סוגי עוגיות" })).toBeNull();
  });

  it("keeps optional categories off when the visitor chooses necessary cookies", () => {
    render(<CookieConsent initialPreferences={null} />);
    revealPanel();

    fireEvent.click(screen.getByRole("button", { name: "רק ההכרחיות" }));

    expect(screen.queryByRole("heading", { name: HEADING })).toBeNull();
    expect(document.cookie).toContain(
      `${COOKIE_CONSENT_NAME}=${serializeCookiePreferences(
        necessaryOnlyCookiePreferences
      )}`
    );
  });

  it("lets the visitor choose categories and reopen the settings from the footer", () => {
    render(
      <>
        <CookieSettingsLink />
        <CookieConsent initialPreferences={necessaryOnlyCookiePreferences} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "הגדרות עוגיות" }));

    const preferences = screen.getByRole("checkbox", {
      name: /העדפות וחוויית שימוש/,
    });
    const analytics = screen.getByRole("checkbox", { name: /מדידה אנונימית/ });
    const marketing = screen.getByRole("checkbox", { name: /שיווק מותאם/ });

    expect(preferences).not.toBeChecked();
    expect(analytics).not.toBeChecked();
    expect(marketing).not.toBeChecked();

    fireEvent.click(preferences);
    fireEvent.click(analytics);
    fireEvent.click(screen.getByRole("button", { name: "שומרים את הבחירה" }));

    expect(parseCookiePreferences(document.cookie.split("=")[1])).toEqual({
      preferences: true,
      analytics: true,
      marketing: false,
    });
    expect(screen.getByRole("button", { name: "הגדרות עוגיות" })).toHaveFocus();
  });
});
