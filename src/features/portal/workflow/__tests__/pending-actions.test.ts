import { describe, expect, it } from "vitest";
import {
  actionsFor,
  countRequiredActions,
  derivePortalActions,
  type PortalActionInput,
  type PortalActionMeetingSlot,
  type PortalActionPayment,
} from "../pending-actions";
import type { ProjectStage } from "@/lib/supabase/types";

const now = new Date("2026-07-30T09:00:00.000Z");
const future = "2026-08-05T09:00:00.000Z";
const past = "2026-07-01T09:00:00.000Z";

function input(overrides: Partial<PortalActionInput> = {}): PortalActionInput {
  return {
    project: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "מערכת ניהול",
      companyName: "לקוח לדוגמה",
      stage: "lead" as ProjectStage,
    },
    intake: null,
    meetingSlots: [],
    payments: [],
    documents: {
      latestDraftVersionId: null,
      latestPublishedVersionId: null,
    },
    now,
    ...overrides,
  };
}

const availableSlot: PortalActionMeetingSlot = {
  id: "slot-1",
  status: "available",
  startsAt: future,
};

const pendingPayment: PortalActionPayment = {
  id: "payment-1",
  status: "pending",
  title: "אפיון ותכנון מלא",
  amountAgorot: 450000,
};

describe("derivePortalActions", () => {
  it("asks a brand-new project's client to fill in the intake", () => {
    const actions = derivePortalActions(input());

    expect(actions).toHaveLength(1);
    expect(actions[0]?.kind).toBe("start_intake");
    expect(actions[0]?.owner).toBe("client");
    expect(actions[0]?.clientHref).toContain("/discovery");
  });

  it("hands a submitted intake to SYSTEMIZE and asks nothing of the client", () => {
    const actions = derivePortalActions(
      input({ intake: { status: "submitted", reviewNote: null } })
    );

    expect(actionsFor(actions, "client")).toHaveLength(0);
    expect(countRequiredActions(actions, "systemize")).toBe(1);
    expect(actions[0]?.kind).toBe("review_intake");
  });

  it("carries the review note into the correction the client is asked for", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "changes_requested", reviewNote: "  חסר פירוט על המלאי  " },
      })
    );

    expect(actions[0]?.kind).toBe("revise_intake");
    expect(actions[0]?.detail).toBe("חסר פירוט על המלאי");
  });

  it("keeps scheduling shut until the intake is approved", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "submitted", reviewNote: null },
        meetingSlots: [availableSlot],
      })
    );

    expect(actions.some((action) => action.kind === "book_meeting")).toBe(false);
  });

  it("asks the client to book once slots are open", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [availableSlot],
      })
    );

    expect(actions.map((action) => action.kind)).toEqual(["book_meeting"]);
  });

  it("asks SYSTEMIZE to publish slots when an approved intake has none left", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-old", status: "available", startsAt: past }],
      })
    );

    expect(actions.map((action) => action.kind)).toEqual([
      "publish_meeting_slots",
    ]);
  });

  it("reports a booked meeting as progress, not as client homework", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-2", status: "booked", startsAt: future }],
      })
    );

    const attend = actions.find((action) => action.kind === "attend_meeting");
    expect(attend?.urgency).toBe("waiting");
    expect(countRequiredActions(actions, "client")).toBe(0);
    expect(countRequiredActions(actions, "systemize")).toBe(1);
  });

  it("puts an open payment on the client and the recording on SYSTEMIZE", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-3", status: "completed", startsAt: past }],
        payments: [pendingPayment],
      })
    );

    const clientAction = actionsFor(actions, "client")[0];
    expect(clientAction?.kind).toBe("pay_request");
    expect(clientAction?.title).toBe(pendingPayment.title);
    expect(
      actions.find((action) => action.kind === "record_payment")?.urgency
    ).toBe("waiting");
  });

  it("asks SYSTEMIZE for the summary once the meeting is done and nothing is billed", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-4", status: "completed", startsAt: past }],
      })
    );

    expect(actions.map((action) => action.kind)).toEqual(["prepare_summary"]);
  });

  it("asks SYSTEMIZE to publish a saved summary draft before billing", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-4", status: "completed", startsAt: past }],
        documents: {
          latestDraftVersionId: "draft-version",
          latestPublishedVersionId: null,
        },
      })
    );

    expect(actions.map((action) => action.kind)).toEqual(["publish_summary"]);
  });

  it("lets the client review a published summary and SYSTEMIZE open billing", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-4", status: "completed", startsAt: past }],
        documents: {
          latestDraftVersionId: null,
          latestPublishedVersionId: "published-version",
        },
      })
    );

    expect(actions.map((action) => action.kind)).toEqual([
      "review_summary",
      "publish_payment_request",
    ]);
    expect(actions[0]?.clientHref).toBe(
      "/portal/documents/published-version"
    );
  });

  it("stops asking for anything once a paid project moved on", () => {
    const actions = derivePortalActions(
      input({
        project: {
          id: "22222222-2222-4222-8222-222222222222",
          name: "מערכת ניהול",
          companyName: "לקוח לדוגמה",
          stage: "full_discovery_and_planning",
        },
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-5", status: "completed", startsAt: past }],
        payments: [{ ...pendingPayment, status: "paid" }],
      })
    );

    expect(actions).toHaveLength(0);
  });

  it("returns nothing for a closed project", () => {
    for (const stage of ["completed", "cancelled"] as const) {
      const actions = derivePortalActions(
        input({
          project: {
            id: "33333333-3333-4333-8333-333333333333",
            name: "מערכת ניהול",
            companyName: "לקוח לדוגמה",
            stage,
          },
          intake: { status: "submitted", reviewNote: null },
          payments: [pendingPayment],
        })
      );

      expect(actions).toEqual([]);
    }
  });

  it("orders what is required today ahead of what is merely in progress", () => {
    const actions = derivePortalActions(
      input({
        intake: { status: "approved", reviewNote: null },
        meetingSlots: [{ id: "slot-6", status: "booked", startsAt: future }],
        payments: [pendingPayment],
      })
    );

    const urgencies = actions.map((action) => action.urgency);
    expect(urgencies).toEqual([...urgencies].sort());
    expect(actions[0]?.urgency).toBe("now");
  });

  it("gives every action a stable, project-scoped identity", () => {
    const first = derivePortalActions(input());
    const second = derivePortalActions(input());

    expect(first[0]?.id).toBe(second[0]?.id);
    expect(first[0]?.id.startsWith(first[0]?.projectId ?? "")).toBe(true);
  });
});
