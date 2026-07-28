/**
 * The accessibility toolbar's settings model.
 *
 * Settings are expressed as data attributes on `<html>`, and every visual effect is a CSS
 * rule keyed off one of those attributes. Nothing here re-renders the page: the toolbar
 * flips an attribute, the stylesheet does the rest. That is what keeps a feature which
 * restyles the entire site out of the React tree of every component it affects.
 *
 * Safe to import from both server and client graphs; it holds no secrets and touches no
 * browser API at module scope.
 */

export const A11Y_STORAGE_KEY = "systemize:a11y";

/** Levelled settings run 0 (off) to 3. Booleans are on or absent. */
export interface A11ySettings {
  readonly contrast: boolean;
  readonly lowSaturation: boolean;
  readonly highlightLinks: boolean;
  readonly readableFont: boolean;
  readonly hideImages: boolean;
  readonly stopAnimations: boolean;
  readonly bigCursor: boolean;
  readonly alignStart: boolean;
  readonly textScale: number;
  readonly lineHeight: number;
  readonly textSpacing: number;
}

export const defaultA11ySettings: A11ySettings = {
  contrast: false,
  lowSaturation: false,
  highlightLinks: false,
  readableFont: false,
  hideImages: false,
  stopAnimations: false,
  bigCursor: false,
  alignStart: false,
  textScale: 0,
  lineHeight: 0,
  textSpacing: 0,
};

/**
 * One attribute per setting.
 *
 * This map is the single source of truth. The React toolbar reads it, and the
 * before-paint restore script is generated from it, so the two cannot drift into
 * disagreeing about an attribute name.
 */
export const A11Y_ATTRIBUTES: Readonly<Record<keyof A11ySettings, string>> = {
  contrast: "data-a11y-contrast",
  lowSaturation: "data-a11y-saturation",
  highlightLinks: "data-a11y-links",
  readableFont: "data-a11y-font",
  hideImages: "data-a11y-images",
  stopAnimations: "data-a11y-motion",
  bigCursor: "data-a11y-cursor",
  alignStart: "data-a11y-align",
  textScale: "data-a11y-text",
  lineHeight: "data-a11y-line",
  textSpacing: "data-a11y-spacing",
};

export const MAX_LEVEL = 3;

export type A11ySettingKey = keyof A11ySettings;

/** The levelled keys, in the order the panel presents them. */
export const levelKeys = ["textScale", "lineHeight", "textSpacing"] as const;

/** The boolean keys, in the order the panel presents them. */
export const toggleKeys = [
  "contrast",
  "highlightLinks",
  "readableFont",
  "lowSaturation",
  "stopAnimations",
  "hideImages",
  "bigCursor",
  "alignStart",
] as const;

/** True when nothing is customised, which is what the reset control keys off. */
export function isDefaultSettings(settings: A11ySettings): boolean {
  return (
    toggleKeys.every((key) => !settings[key]) &&
    levelKeys.every((key) => settings[key] === 0)
  );
}

/**
 * Writes the settings onto an element, normally `document.documentElement`.
 *
 * Absent rather than `"off"` for an inactive setting: it keeps the CSS selectors to a
 * plain attribute-presence check and leaves no attribute noise in the DOM for a reader
 * inspecting the page.
 */
export function applyA11ySettings(root: Element, settings: A11ySettings): void {
  for (const key of toggleKeys) {
    const attribute = A11Y_ATTRIBUTES[key];
    if (settings[key]) {
      root.setAttribute(attribute, "on");
    } else {
      root.removeAttribute(attribute);
    }
  }

  for (const key of levelKeys) {
    const attribute = A11Y_ATTRIBUTES[key];
    const level = settings[key];
    if (level > 0) {
      root.setAttribute(attribute, String(level));
    } else {
      root.removeAttribute(attribute);
    }
  }
}

/**
 * Narrows an unknown parsed value from storage into settings.
 *
 * Storage is untrusted input — a user, an extension or an older version of this site
 * could have written anything there — so every field is validated and anything
 * unrecognised falls back to its default rather than reaching the DOM.
 */
export function parseA11ySettings(value: unknown): A11ySettings {
  if (typeof value !== "object" || value === null) {
    return defaultA11ySettings;
  }

  const record = value as Record<string, unknown>;
  const clampLevel = (input: unknown): number =>
    typeof input === "number" && Number.isInteger(input) && input > 0
      ? Math.min(input, MAX_LEVEL)
      : 0;

  return {
    contrast: record.contrast === true,
    lowSaturation: record.lowSaturation === true,
    highlightLinks: record.highlightLinks === true,
    readableFont: record.readableFont === true,
    hideImages: record.hideImages === true,
    stopAnimations: record.stopAnimations === true,
    bigCursor: record.bigCursor === true,
    alignStart: record.alignStart === true,
    textScale: clampLevel(record.textScale),
    lineHeight: clampLevel(record.lineHeight),
    textSpacing: clampLevel(record.textSpacing),
  };
}

/**
 * The before-paint restore script.
 *
 * Saved settings cannot be part of the first React render: the server has no access to
 * `localStorage`, so rendering them would guarantee a hydration mismatch (AGENTS.md §3).
 * Restoring them in an effect instead is correct but visibly late — a visitor who needs
 * high contrast would get a flash of the ordinary page on every navigation.
 *
 * So the attributes are restored by this snippet, which runs before the body paints, and
 * React's own first render stays deterministic because it never renders these values.
 * It is a build-time constant, so `src/proxy.ts` allows it in the CSP by its SHA-256 hash
 * rather than by the per-request nonce, which a browser hides from the DOM and which would
 * therefore mismatch on hydration.
 *
 * Generated from `A11Y_ATTRIBUTES` and the key lists rather than hand-written, so adding a
 * setting cannot leave the restore path behind.
 */
export const a11yRestoreScript = `(function(){try{var raw=window.localStorage.getItem(${JSON.stringify(
  A11Y_STORAGE_KEY
)});if(!raw)return;var s=JSON.parse(raw);if(!s||typeof s!=="object")return;var r=document.documentElement;var t=${JSON.stringify(
  Object.fromEntries(toggleKeys.map((key) => [key, A11Y_ATTRIBUTES[key]]))
)};var l=${JSON.stringify(
  Object.fromEntries(levelKeys.map((key) => [key, A11Y_ATTRIBUTES[key]]))
)};for(var k in t){if(s[k]===true)r.setAttribute(t[k],"on")}for(var n in l){var v=s[n];if(typeof v==="number"&&v>0)r.setAttribute(l[n],String(Math.min(v,${MAX_LEVEL})))}}catch(e){}})();`;
