/**
 * Keeps characters the embedded PDF font cannot draw out of the rendered document.
 *
 * The PDF embeds Heebo and has no fallback font. A character outside its coverage is drawn
 * as the font's `.notdef` glyph — which in Heebo is not blank: it has an outline and an
 * advance of 0.657em. One stray character therefore does two visible things at once: it
 * prints a mark in the middle of a sentence, and it pushes the rest of that line off the
 * margin, which reads as text that will not align.
 *
 * The browser never shows this, because it falls back to another font for the same
 * character. So the defect only ever appears in the downloaded file — and the content that
 * triggers it is ordinary: the system-plan and introductory-summary editors both ingest
 * pasted ChatGPT output, which routinely carries emoji bullets, arrows, check marks and
 * narrow no-break spaces.
 *
 * The allowlist below is verified against the real font file in `pdf-text.test.ts`, so it
 * cannot drift from what Heebo actually contains.
 */

/** Characters that carry no meaning of their own and only ever disturb the line. */
const INVISIBLE = new Set([
  0x00ad, // soft hyphen
  0x200b, 0x200c, 0x200d, // zero-width space / non-joiner / joiner
  0x200e, 0x200f, // bidi marks — the base direction is set by the renderer, not the text
  0x2028, 0x2029, // line / paragraph separators
  0x2060, // word joiner
  0xfeff, // byte order mark
]);

/** Characters that mean "a space" but are not one the font can draw. */
const SPACE_LIKE = new Set([
  0x0009, // tab
  0x000b, 0x000c, // vertical tab, form feed
  0x00a0, // no-break space
  0x2007, 0x2008, 0x2009, 0x200a, // figure / punctuation / thin / hair space
  0x202f, // narrow no-break space
  0x205f, // medium mathematical space
  0x3000, // ideographic space
]);

/**
 * Ranges Heebo covers. Anything outside is dropped rather than drawn as a box: every
 * character that falls outside is decorative — emoji, dingbats, arrows, box drawing — and a
 * missing bullet reads better than a stray glyph in the middle of a price quote.
 */
const DRAWABLE_RANGES: readonly (readonly [number, number])[] = [
  [0x0020, 0x007e], // ASCII printable
  [0x00a1, 0x00ac], // Latin-1 punctuation
  [0x00ae, 0x00ff], // Latin-1 symbols and accented letters
  [0x05b0, 0x05bc], // Hebrew points
  [0x05be, 0x05bf], // maqaf, rafe
  [0x05c1, 0x05c2], // shin and sin dots
  [0x05c7, 0x05c7], // qamats qatan
  [0x05d0, 0x05ea], // Hebrew letters
  [0x05f0, 0x05f4], // Hebrew ligatures, geresh and gershayim
  [0x2013, 0x2014], // en dash, em dash
  [0x2018, 0x201a], // single curly quotes
  [0x201c, 0x201d], // double curly quotes
  [0x2022, 0x2022], // bullet
  [0x2026, 0x2026], // ellipsis
  [0x2039, 0x203a], // single guillemets
  [0x20aa, 0x20aa], // shekel sign
  [0x20ac, 0x20ac], // euro sign
];

export function isDrawableInPdf(codePoint: number): boolean {
  return DRAWABLE_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to);
}

/**
 * The allowlist as a flat list of code points, for the test that checks it against the font.
 * Exported for that purpose only.
 */
export function drawableCodePoints(): readonly number[] {
  const points: number[] = [];
  for (const [from, to] of DRAWABLE_RANGES) {
    for (let point = from; point <= to; point += 1) points.push(point);
  }
  return points;
}

export function pdfSafeText(value: string): string {
  // React PDF corrupts explicit line-break controls inside a bidi Text node: CRLF, bare CR,
  // and even a valid LF can surface as an accented-looking glyph at a wrapped Hebrew line.
  // Structured multiline values are split into separate fields/list rows before they reach
  // this boundary, so any newline still inside one Text node is paragraph whitespace.
  const normalized = value.replace(/\r\n?|\n/g, " ");
  let cleaned = "";
  for (const character of normalized) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    if (INVISIBLE.has(codePoint)) continue;
    if (SPACE_LIKE.has(codePoint)) {
      cleaned += " ";
      continue;
    }
    if (isDrawableInPdf(codePoint)) cleaned += character;
  }

  // Dropping a leading emoji bullet leaves the space that followed it, and folding a tab
  // leaves an indent the author never typed. Both would still look like broken alignment.
  return cleaned.replace(/ {2,}/g, " ").trim();
}
