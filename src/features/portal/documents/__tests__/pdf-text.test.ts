import { resolve } from "node:path";
import { openSync } from "fontkit";
import { describe, expect, it } from "vitest";
import {
  drawableCodePoints,
  isDrawableInPdf,
  pdfSafeText,
} from "../pdf-text";

/**
 * The allowlist in `pdf-text.ts` is a claim about what the embedded font contains. These
 * assertions check that claim against the font file itself, so the two cannot drift: adding
 * a range that Heebo does not actually cover would put the very glyph this module exists to
 * prevent back into the document.
 */
const fonts = ["Heebo-Medium.ttf", "Heebo-Bold.ttf"].map((file) =>
  openSync(resolve(process.cwd(), "src/assets/fonts", file))
);

describe("pdfSafeText", () => {
  it("allows only code points both embedded fonts can actually draw", () => {
    const undrawable = drawableCodePoints().filter((codePoint) =>
      fonts.some((font) => !font.hasGlyphForCodePoint(codePoint))
    );

    expect(undrawable.map((cp) => `U+${cp.toString(16).toUpperCase()}`)).toEqual([]);
  });

  it("removes the characters that would print as a box and shift the line", () => {
    // Heebo's .notdef is not blank: it has an outline and an advance of 0.657em, so one
    // undrawable character both prints a mark and pushes the rest of the line off the
    // margin. These are the ones pasted AI output actually carries.
    for (const character of ["🚀", "✅", "✓", "★", "→", "‣", "🔹"]) {
      expect(fonts[0]?.hasGlyphForCodePoint(character.codePointAt(0) ?? 0)).toBe(false);
      expect(isDrawableInPdf(character.codePointAt(0) ?? 0)).toBe(false);
      expect(pdfSafeText(`${character} מערכת ראשונית`)).toBe("מערכת ראשונית");
    }
  });

  it("folds the space-like characters the font cannot draw into a real space", () => {
    expect(pdfSafeText("שלב\tראשון")).toBe("שלב ראשון");
    expect(pdfSafeText("7 ימים")).toBe("7 ימים");
    expect(pdfSafeText("א ב")).toBe("א ב");
  });

  it("drops invisible formatting characters, including hand-injected bidi marks", () => {
    expect(pdfSafeText("‏שלום‏")).toBe("שלום");
    expect(pdfSafeText("מ­ילה")).toBe("מילה");
    expect(pdfSafeText("﻿כותרת")).toBe("כותרת");
  });

  it("leaves ordinary Hebrew, Latin, punctuation and currency untouched", () => {
    const value =
      "ברור לנו שיש לנו כמה PRIORITIES חשובים יותר — כ־4,500 ₪, 50% מראש.\nשורה שנייה: מע״מ, גרש ׳, נקודותיים…";
    expect(pdfSafeText(value)).toBe(
      "ברור לנו שיש לנו כמה PRIORITIES חשובים יותר — כ־4,500 ₪, 50% מראש. שורה שנייה: מע״מ, גרש ׳, נקודותיים…"
    );
  });

  it("folds line breaks and unusable indentation into paragraph whitespace", () => {
    expect(pdfSafeText("שורה ראשונה\n\tשורה שנייה")).toBe(
      "שורה ראשונה שורה שנייה"
    );
  });

  it("normalizes Windows and legacy carriage-return line endings", () => {
    expect(pdfSafeText("שורה ראשונה\r\nשורה שנייה\rשורה שלישית")).toBe(
      "שורה ראשונה שורה שנייה שורה שלישית"
    );
    expect(pdfSafeText("תוקף.\r\nהקבצים מחכים")).toBe(
      "תוקף. הקבצים מחכים"
    );
  });
});
