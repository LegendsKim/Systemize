import { describe, expect, it } from "vitest";
import {
  emptyInternalNotes,
  hasInternalNotes,
  internalNotesFormSchema,
  projectReadinessLabels,
  projectReadinessValues,
} from "../internal-notes";

const projectId = "11111111-1111-4111-8111-111111111111";

describe("internalNotesFormSchema", () => {
  it("saves a note that was only half written", () => {
    const parsed = internalNotesFormSchema.safeParse({
      projectId,
      impression: "בעל העסק מדבר על הבעיה בבהירות.",
      budgetSignal: "",
      readiness: "medium",
      risks: "",
      flags: "",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.budgetSignal).toBe("");
  });

  it("defaults readiness rather than refusing the save", () => {
    const parsed = internalNotesFormSchema.safeParse({ projectId });

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.readiness).toBe("unknown");
  });

  it("rejects a readiness the database column would not accept", () => {
    const parsed = internalNotesFormSchema.safeParse({
      projectId,
      readiness: "very-high",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a note longer than the column allows", () => {
    const parsed = internalNotesFormSchema.safeParse({
      projectId,
      impression: "א".repeat(4_001),
    });

    expect(parsed.success).toBe(false);
  });

  it("refuses a project id that is not a project id", () => {
    expect(
      internalNotesFormSchema.safeParse({ projectId: "not-a-uuid" }).success
    ).toBe(false);
  });
});

describe("hasInternalNotes", () => {
  it("treats a blank note as nothing recorded", () => {
    expect(hasInternalNotes(emptyInternalNotes)).toBe(false);
    expect(
      hasInternalNotes({ ...emptyInternalNotes, impression: "   " })
    ).toBe(false);
  });

  it("counts a readiness decision on its own as a recorded note", () => {
    expect(hasInternalNotes({ ...emptyInternalNotes, readiness: "low" })).toBe(
      true
    );
  });

  it("counts any written field", () => {
    expect(
      hasInternalNotes({ ...emptyInternalNotes, flags: "מחליט לא נכח בשיחה" })
    ).toBe(true);
  });
});

describe("readiness presentation", () => {
  it("labels every value the schema accepts", () => {
    for (const value of projectReadinessValues) {
      expect(projectReadinessLabels[value]).toBeTruthy();
    }
  });
});
