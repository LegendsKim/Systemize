import { describe, expect, it } from "vitest";
import { describeAnswerProgress } from "../answer-progress";
import { intakeMinimumAnswerLength } from "../schemas";

describe("answer progress", () => {
  it("states the target before anything is written", () => {
    const progress = describeAnswerProgress(0, true, 5000);

    expect(progress.tone).toBe("short");
    expect(progress.label).toContain(String(intakeMinimumAnswerLength));
  });

  it("shows how far a short required answer still is", () => {
    const progress = describeAnswerProgress(4, true, 5000);

    expect(progress.tone).toBe("short");
    expect(progress.label).toContain("4");
    expect(progress.label).toContain(String(intakeMinimumAnswerLength));
  });

  it("stops nagging once the answer clears the floor", () => {
    expect(describeAnswerProgress(intakeMinimumAnswerLength, true, 5000).tone).toBe(
      "ok"
    );
  });

  /* An optional field has no floor, so a single word is a complete answer. */
  it("never marks an optional answer as short", () => {
    expect(describeAnswerProgress(1, false, 5000).tone).toBe("ok");
  });

  it("warns as the field approaches its ceiling", () => {
    expect(describeAnswerProgress(4900, false, 5000).tone).toBe("near-limit");
  });
});
