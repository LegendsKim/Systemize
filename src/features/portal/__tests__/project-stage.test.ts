import { describe, expect, it } from "vitest";
import {
  clientProjectStageLabels,
  projectStageLabels,
} from "../project-stage";

describe("project stage labels", () => {
  it("keeps sales terminology in admin and uses process wording for clients", () => {
    expect(projectStageLabels.lead).toBe("ליד חדש");
    expect(clientProjectStageLabels.lead).toBe("שלב היכרות ראשוני");
  });
});
