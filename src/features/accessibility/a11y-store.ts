"use client";
// Required: reads and writes localStorage and the document element.

import {
  A11Y_STORAGE_KEY,
  applyA11ySettings,
  defaultA11ySettings,
  parseA11ySettings,
  type A11ySettings,
} from "./a11y-settings";

/**
 * The settings store, modelled as an external store rather than as component state.
 *
 * The settings genuinely live outside React: they are persisted in `localStorage` and
 * expressed as attributes on `<html>`, and they are already applied by the before-paint
 * script before React runs at all. Mirroring that into `useState` and syncing it in an
 * effect would mean a render pass whose only job is to catch up with a value that was
 * correct before the component mounted.
 *
 * `useSyncExternalStore` is the supported way to read such a value: it renders
 * `getServerSnapshot` on the server and through hydration, then switches to `getSnapshot`,
 * so the first client render still matches the server's and no mismatch is possible.
 *
 * The snapshot is cached because `useSyncExternalStore` compares snapshots by reference —
 * parsing storage afresh on every call would return a new object each time and spin.
 */

let snapshot: A11ySettings = defaultA11ySettings;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): A11ySettings {
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (raw === null) return defaultA11ySettings;
    return parseA11ySettings(JSON.parse(raw));
  } catch {
    // Corrupt or unavailable storage (private mode, quota, a hand-edited value) is not an
    // error worth surfacing: the defaults are a perfectly good state to be in.
    return defaultA11ySettings;
  }
}

export function subscribeToA11ySettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getA11ySettingsSnapshot(): A11ySettings {
  if (!loaded) {
    snapshot = readStorage();
    loaded = true;
  }
  return snapshot;
}

/** Always the defaults: the server cannot know what this visitor saved. */
export function getA11ySettingsServerSnapshot(): A11ySettings {
  return defaultA11ySettings;
}

/** Persists, applies to the document, and notifies subscribers. */
export function writeA11ySettings(next: A11ySettings): void {
  snapshot = next;
  loaded = true;

  applyA11ySettings(document.documentElement, next);

  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can legitimately fail. The setting still applies for this page view, which
    // is strictly better than refusing to apply it at all.
  }

  for (const listener of listeners) {
    listener();
  }
}
