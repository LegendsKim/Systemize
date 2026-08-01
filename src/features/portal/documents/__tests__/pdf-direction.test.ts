import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A source-level contract for the two PDF renderers.
 *
 * `direction` is not one of @react-pdf's inheritable style properties: declaring `rtl` on
 * the page does not reach a text node, so a `<Text>` that does not set it runs the bidi
 * algorithm at an LTR base level. Hebrew then renders with its closing punctuation on the
 * wrong edge and embedded Latin runs in the wrong place — a defect that is invisible in a
 * unit test of the data and only shows up in the rendered file.
 *
 * The renderers therefore route every string through `RtlText` or `LtrText`, and these
 * assertions keep a bare `<Text>` — or a return to hand-injected bidi marks — from creeping
 * back in.
 */
const renderers = [
  "introductory-summary-pdf.tsx",
  "system-plan-pdf.tsx",
] as const;

describe.each(renderers)("%s", (file) => {
  const source = readFileSync(
    resolve(process.cwd(), "src/features/portal/documents", file),
    "utf8"
  );

  it("declares a base direction on every text node", () => {
    // The only `<Text>` elements allowed are the two inside the wrappers themselves.
    const bareTextElements = source.match(/<Text[\s>]/g) ?? [];
    expect(bareTextElements).toHaveLength(2);
    expect(source).toContain("[styles.rtl, style]");
    expect(source).toContain("[styles.ltr, style]");
    expect(source).toMatch(/rtl:\s*\{\s*direction:\s*"rtl"/);
  });

  it("routes every string through the font-coverage sanitiser", () => {
    // Without this, one emoji or tab in the pasted source text prints Heebo's .notdef
    // outline and shifts the rest of the line 0.657em off the margin.
    expect(source).toContain('from "./pdf-text"');
    expect(source).toContain("pdfSafeText");
    expect(source.match(/\{drawable\(children\)\}/g)).toHaveLength(2);
  });

  it("never hand-injects bidi control characters into the text", () => {
    // Wrapping a string in U+200F cannot change the paragraph's base level — that is an
    // argument to the algorithm — and it leaves a stray glyph in the output instead.
    expect(source).not.toContain("‏");
    expect(source).not.toContain("‎");
    expect(source).not.toContain("\\u200F");
    expect(source).not.toContain("\\u200E");
  });
});
