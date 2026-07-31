import { beforeEach, describe, expect, it } from "vitest";
import { emptyIntakeAnswers } from "../intake";
import {
  clearAllLocalIntakeDrafts,
  clearLocalIntakeDraft,
  localDraftDiffers,
  localIntakeDraftSnapshot,
  purgeExpiredIntakeDrafts,
  writeLocalIntakeDraft,
} from "../intake-draft";

const projectId = "123e4567-e89b-42d3-a456-426614174000";
const otherProjectId = "123e4567-e89b-42d3-a456-426614174001";
const now = 1_700_000_000_000;

function draftWith(overrides: Partial<{ companyOverview: string }> = {}) {
  const answers = emptyIntakeAnswers();
  answers.companyOverview = overrides.companyOverview ?? "טיוטה שנכתבה במכשיר";
  return { answers, clientReply: "", step: 2, savedAt: now };
}

describe("local intake draft", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns what was written", () => {
    writeLocalIntakeDraft(projectId, draftWith());

    const restored = localIntakeDraftSnapshot(projectId);

    expect(restored?.answers.companyOverview).toBe("טיוטה שנכתבה במכשיר");
    expect(restored?.step).toBe(2);
  });

  it("has nothing to offer a project that was never typed into", () => {
    expect(localIntakeDraftSnapshot(projectId)).toBeNull();
  });

  /*
   * `useSyncExternalStore` compares snapshots by identity and would loop forever on a
   * freshly parsed object, so unchanged storage must return the very same value.
   */
  it("returns a stable value while the stored text is unchanged", () => {
    writeLocalIntakeDraft(projectId, draftWith());

    expect(localIntakeDraftSnapshot(projectId)).toBe(
      localIntakeDraftSnapshot(projectId)
    );
  });

  it("sees a rewrite", () => {
    writeLocalIntakeDraft(projectId, draftWith());
    writeLocalIntakeDraft(
      projectId,
      draftWith({ companyOverview: "נוסח מאוחר יותר" })
    );

    expect(localIntakeDraftSnapshot(projectId)?.answers.companyOverview).toBe(
      "נוסח מאוחר יותר"
    );
  });

  it("survives a corrupted entry without throwing", () => {
    window.localStorage.setItem(
      `systemize:intake-draft:${projectId}`,
      "{not json"
    );

    expect(localIntakeDraftSnapshot(projectId)).toBeNull();
  });

  it("forgets a draft on request", () => {
    writeLocalIntakeDraft(projectId, draftWith());
    clearLocalIntakeDraft(projectId);

    expect(localIntakeDraftSnapshot(projectId)).toBeNull();
  });

  it("clears every client draft on logout without touching unrelated storage", () => {
    writeLocalIntakeDraft(projectId, draftWith());
    writeLocalIntakeDraft(otherProjectId, draftWith());
    window.localStorage.setItem("unrelated-key", "left alone");

    clearAllLocalIntakeDrafts();

    expect(localIntakeDraftSnapshot(projectId)).toBeNull();
    expect(localIntakeDraftSnapshot(otherProjectId)).toBeNull();
    expect(window.localStorage.getItem("unrelated-key")).toBe("left alone");
  });

  /* Hygiene, not correctness: a month-old draft leaves a device that may be shared. */
  it("purges aged drafts across every project and keeps current ones", () => {
    writeLocalIntakeDraft(projectId, draftWith());
    writeLocalIntakeDraft(otherProjectId, {
      ...draftWith(),
      savedAt: now + 29 * 24 * 60 * 60 * 1000,
    });
    window.localStorage.setItem("unrelated-key", "left alone");

    purgeExpiredIntakeDrafts(now + 31 * 24 * 60 * 60 * 1000);

    expect(localIntakeDraftSnapshot(projectId)).toBeNull();
    expect(localIntakeDraftSnapshot(otherProjectId)).not.toBeNull();
    expect(window.localStorage.getItem("unrelated-key")).toBe("left alone");
  });

  it("only claims to differ when it actually holds different text", () => {
    const draft = draftWith();
    const sameAnswers = { ...draft.answers };

    expect(localDraftDiffers(draft, sameAnswers, "")).toBe(false);
    expect(
      localDraftDiffers(draft, { ...sameAnswers, companyOverview: "אחר" }, "")
    ).toBe(true);
    expect(localDraftDiffers(draft, sameAnswers, "תגובה")).toBe(true);
  });
});
