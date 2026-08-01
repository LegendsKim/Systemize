/**
 * Minimal typings for the one fontkit call `pdf-text.test.ts` makes.
 *
 * fontkit ships no declarations of its own. It is not a direct dependency either — it
 * arrives with `@react-pdf/renderer`, which uses it to embed and subset the fonts, so the
 * test reads glyph coverage from exactly the library that will draw the document. Only the
 * surface actually used is declared; anything more would be guessing at an API this
 * repository does not call.
 */
declare module "fontkit" {
  export interface OpenedFont {
    hasGlyphForCodePoint(codePoint: number): boolean;
  }

  export function openSync(source: string): OpenedFont;
}
