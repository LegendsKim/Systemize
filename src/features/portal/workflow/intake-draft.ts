/**
 * The local half of draft persistence.
 *
 * The server autosave is the durable one, but it is debounced and can fail; this runs on
 * every keystroke and survives a closed tab, a dead network and a crashed browser. It is
 * read only after mount — never during render — so the first client render still matches
 * the server's.
 *
 * Only the client's own answers, on the client's own device. Nothing here is authoritative:
 * a local draft is offered back to the person who wrote it, and the server row stays the
 * record.
 */

import {
  emptyIntakeAnswers,
  intakeFieldNames,
  type IntakeAnswers,
} from "./intake";

export interface LocalIntakeDraft {
  readonly answers: IntakeAnswers;
  readonly clientReply: string;
  readonly step: number;
  /** Epoch milliseconds, used to expire the entry and to compare against the server. */
  readonly savedAt: number;
}

const keyPrefix = "systemize:intake-draft:";

/** Drafts older than this are the user's past, not their work in progress. */
const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

function storageKey(projectId: string): string {
  return `${keyPrefix}${projectId}`;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Private modes and blocked storage are a missing convenience, never an error.
    return null;
  }
}

/**
 * The last parsed draft per project, keyed by the exact text it was parsed from.
 *
 * `useSyncExternalStore` calls its snapshot during render and compares by identity, so
 * returning a freshly parsed object each time would loop forever. Caching against the raw
 * string keeps the identity stable for as long as the stored text is unchanged.
 */
const snapshots = new Map<
  string,
  { readonly raw: string | null; readonly value: LocalIntakeDraft | null }
>();

export function subscribeToLocalIntakeDraft(onChange: () => void): () => void {
  // Same-tab writes are already followed by a render; this covers the second tab.
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function localIntakeDraftSnapshot(
  projectId: string
): LocalIntakeDraft | null {
  const store = storage();
  const raw = store ? store.getItem(storageKey(projectId)) : null;
  const cached = snapshots.get(projectId);
  if (cached && cached.raw === raw) {
    return cached.value;
  }

  const value = raw ? parseDraft(raw) : null;
  snapshots.set(projectId, { raw, value });
  return value;
}

/** The server has no device storage, so the server snapshot is always empty. */
export function emptyLocalIntakeDraft(): LocalIntakeDraft | null {
  return null;
}

/**
 * Drops drafts that have aged out, across every project this device has one for.
 *
 * Expiry is hygiene, not correctness: a draft that is newer than the server row is the
 * client's most recent work however old it is, so age is never used to decide what to
 * restore. It is used to decide what a shared device should stop holding — which is a
 * sweep, run once on arrival, not a filter on the read path.
 */
export function purgeExpiredIntakeDrafts(now: number): void {
  const store = storage();
  if (!store) return;

  try {
    const expired: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (!key?.startsWith(keyPrefix)) continue;

      const raw = store.getItem(key);
      const draft = raw ? parseDraft(raw) : null;
      if (!draft || now - draft.savedAt > maxAgeMs) {
        expired.push(key);
      }
    }

    for (const key of expired) {
      store.removeItem(key);
      snapshots.delete(key.slice(keyPrefix.length));
    }
  } catch {
    // Storage that cannot be enumerated is storage we leave alone.
  }
}

function parseDraft(raw: string): LocalIntakeDraft | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const record = parsed as Record<string, unknown>;
    const savedAt = typeof record.savedAt === "number" ? record.savedAt : 0;
    if (savedAt <= 0) return null;

    const source =
      record.answers && typeof record.answers === "object"
        ? (record.answers as Record<string, unknown>)
        : {};
    const answers = emptyIntakeAnswers();
    for (const name of intakeFieldNames) {
      const value = source[name];
      if (typeof value === "string") {
        answers[name] = value.slice(0, 5000);
      }
    }

    return {
      answers,
      clientReply:
        typeof record.clientReply === "string"
          ? record.clientReply.slice(0, 2000)
          : "",
      step:
        typeof record.step === "number" && record.step >= 1 && record.step <= 5
          ? record.step
          : 1,
      savedAt,
    };
  } catch {
    return null;
  }
}

export function writeLocalIntakeDraft(
  projectId: string,
  draft: LocalIntakeDraft
): void {
  const store = storage();
  if (!store) return;
  try {
    const raw = JSON.stringify(draft);
    store.setItem(storageKey(projectId), raw);
    // Keep the snapshot identity in step with what was just stored.
    snapshots.set(projectId, { raw, value: draft });
  } catch {
    // A full quota must not interrupt typing. The server autosave still runs.
  }
}

export function clearLocalIntakeDraft(projectId: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(storageKey(projectId));
    snapshots.delete(projectId);
  } catch {
    // Nothing to recover from: the entry expires on its own.
  }
}

/**
 * Removes every intake draft owned by this application without touching unrelated
 * localStorage entries.
 *
 * Logout is an account boundary. A project id is not a user id, so retaining these
 * answers on a shared device could show the previous client's text after another person
 * signs in. Clearing the whole bounded namespace is therefore intentional.
 */
export function clearAllLocalIntakeDrafts(): void {
  const store = storage();
  if (!store) {
    snapshots.clear();
    return;
  }

  try {
    const keys: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key?.startsWith(keyPrefix)) keys.push(key);
    }
    for (const key of keys) {
      store.removeItem(key);
    }
  } catch {
    // The server session is still allowed to end even when storage is unavailable.
  } finally {
    snapshots.clear();
  }
}

/** True when the local copy holds text the server row does not have. */
export function localDraftDiffers(
  draft: LocalIntakeDraft,
  answers: IntakeAnswers,
  clientReply: string
): boolean {
  if (draft.clientReply !== clientReply) return true;
  return intakeFieldNames.some((name) => draft.answers[name] !== answers[name]);
}
