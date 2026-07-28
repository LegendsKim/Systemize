# Systemize brand assets

## The idea

Code turns business activity into an ordered system: software on the outside, aligned
processes on the inside.

The mark is a custom code-and-process symbol, not a stock `</>` icon. It uses a 24 × 24
integer grid, horizontal and 45° segments only, and a single 1.25-unit monoline. Two code
brackets contain three ordered workflow lines. The mark is deliberately monochrome:
software and systemisation are expressed by geometry, not decoration.

## Concept decision

Three genuinely different directions were explored:

1. **Code organises process — selected.** Two angular code brackets contain three aligned
   workflow lines. It communicates software immediately and systemisation on the second
   read, remains neutral in RTL and survives at 16px. Its main risk is resembling a stock
   code icon; the three internal process rails replace the generic slash and make the
   construction specific to Systemize.
2. **API docking — rejected.** Two opposing software modules joined at the centre. It was
   minimal, but the silhouette resembled an `H` and the software context was too implicit.
3. **Physical connector — rejected.** A cable entered a chamfered body with two active
   pins. It read as an electronic component rather than an advanced system integration.

## Usage

- Minimum digital size: **16px** for the app icon; **24px** for the transparent mark.
- Clear space: keep at least **25% of the mark height** free on every side.
- On light backgrounds use `systemize-mark.svg` or `systemize-lockup.svg`.
- On dark backgrounds use the monochrome `-white` files.
- Use `systemize-mark-mono.svg` when only one ink is available.
- Use `systemize-app-icon.svg` for square avatars, browser icons and app tiles.

Colours:

- Ink `#2b3440`
- Deep ink `#20262f`
- Teal `#008f8a`
- Light teal `#4bb8c4`
- Paper `#f5f6f7`

Measured WCAG contrast ratios: paper on deep ink **14.07:1** and ink on paper **11.64:1**.
Both exceed the 3:1 non-text contrast requirement.

The lockup uses Space Grotesk 600 with `0.22em` tracking. The OFL-licensed Latin WOFF2 is
embedded so the SVG is self-contained in browsers. Embedded web fonts are not reliably
honoured by Illustrator or PowerPoint; use the supplied PNG exports there, or install
Space Grotesk before importing the SVG.

## Do not

1. Do not mirror, rotate, round, stretch or redraw the mark.
2. Do not add gradients, glow, shadow, extra colours or a gear/robot/AI motif.
3. Do not colour the internal process lines separately from the code brackets.

Regenerate every SVG, PNG and `src/app/icon.svg` from the canonical geometry with:

```sh
npm run brand:generate
```
