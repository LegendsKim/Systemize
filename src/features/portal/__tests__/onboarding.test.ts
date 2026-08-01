import { describe, expect, it } from "vitest";
import { portalJourneyPhases, portalStageGuidance } from "../onboarding";
import type { ProjectStage } from "@/lib/supabase/types";

const projectStages: ProjectStage[] = [
  "lead",
  "intro_call_scheduled",
  "initial_summary_preparation",
  "discovery_offer_awaiting_client",
  "discovery_payment_pending",
  "full_discovery_and_planning",
  "solution_options_preparation",
  "proposal_and_contract_awaiting_client",
  "initial_payment_pending",
  "delivery",
  "client_review",
  "rollout",
  "support",
  "completed",
  "cancelled",
];

describe("portal onboarding guidance", () => {
  it("gives every project stage clear customer-facing guidance", () => {
    expect(Object.keys(portalStageGuidance)).toEqual(projectStages);

    for (const stage of projectStages) {
      const guidance = portalStageGuidance[stage];
      expect(guidance.headline.length).toBeGreaterThan(10);
      expect(guidance.detail.length).toBeGreaterThan(20);
      expect(guidance.systemizeNext.length).toBeGreaterThan(10);
      expect(portalJourneyPhases[guidance.phaseIndex - 1]).toBe(guidance.phase);
    }
  });

  it("marks the known client decision points as requiring attention", () => {
    expect(
      projectStages.filter(
        (stage) => portalStageGuidance[stage].clientActionRequired
      )
    ).toEqual([
      "intro_call_scheduled",
      "discovery_offer_awaiting_client",
      "discovery_payment_pending",
      "proposal_and_contract_awaiting_client",
      "initial_payment_pending",
      "client_review",
    ]);
  });
});
