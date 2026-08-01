import { describe, expect, it } from "vitest";
import { presentProjectEvent } from "../project-events";

describe("presentProjectEvent", () => {
  it("describes a known event for both audiences", () => {
    const presentation = presentProjectEvent("meeting_booked");

    expect(presentation.actor).toBe("client");
    expect(presentation.clientVisible).toBe(true);
    expect(presentation.title).not.toBe("");
  });

  it("keeps internal bookkeeping out of the client timeline", () => {
    expect(presentProjectEvent("invitation_created").clientVisible).toBe(false);
    expect(presentProjectEvent("invitation_revoked").clientVisible).toBe(false);
    expect(presentProjectEvent("invitation_reissued").clientVisible).toBe(false);
    expect(presentProjectEvent("project_created").clientVisible).toBe(false);
  });

  it("renders an event written by a newer release without failing", () => {
    const presentation = presentProjectEvent("contract_signed");

    expect(presentation.title).toBe("עדכון בתהליך");
    expect(presentation.clientVisible).toBe(false);
  });
});
