import type { PortalProjectSummary } from "@/server/repositories/portal.repository";
import type { ProjectWorkflowSnapshot } from "@/server/repositories/workflow.repository";
import type { ProjectDocumentSnapshot } from "@/server/repositories/document.repository";
import {
  derivePortalActions,
  type PortalAction,
  type PortalActionInput,
} from "./pending-actions";

/**
 * The seam between stored rows and the pure action model.
 *
 * `derivePortalActions` deliberately knows nothing about column names, so the snake_case
 * translation lives here — one adapter both surfaces share, instead of each page
 * reshaping rows slightly differently and drifting apart.
 */
export function toPortalActionInput(
  project: PortalProjectSummary,
  workflow: ProjectWorkflowSnapshot | undefined,
  now: Date,
  document: ProjectDocumentSnapshot | undefined
): PortalActionInput {
  return {
    project: {
      id: project.id,
      name: project.name,
      companyName: project.companyName,
      stage: project.stage,
    },
    intake: workflow?.intake
      ? {
          status: workflow.intake.status,
          reviewNote: workflow.intake.review_note,
        }
      : null,
    meetingSlots: (workflow?.meetingSlots ?? []).map((slot) => ({
      id: slot.id,
      status: slot.status,
      startsAt: slot.starts_at,
    })),
    payments: (workflow?.payments ?? []).map((payment) => ({
      id: payment.id,
      status: payment.status,
      title: payment.title,
      amountAgorot: payment.amount_agorot,
    })),
    documents: {
      latestDraftVersionId: document?.latestDraft?.id ?? null,
      latestPublishedVersionId: document?.latestPublished?.id ?? null,
    },
    now,
  };
}

export function derivePortalActionsForProjects(
  projects: readonly PortalProjectSummary[],
  workflows: ReadonlyMap<string, ProjectWorkflowSnapshot>,
  now: Date,
  documents: readonly ProjectDocumentSnapshot[] = []
): readonly PortalAction[] {
  const documentsByProject = new Map(
    documents.map((document) => [document.projectId, document])
  );

  return projects.flatMap((project) =>
    derivePortalActions(
      toPortalActionInput(
        project,
        workflows.get(project.id),
        now,
        documentsByProject.get(project.id)
      )
    )
  );
}
