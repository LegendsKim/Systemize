import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emptyInternalNotes,
  type InternalNotesDefaults,
} from "@/features/portal/admin/internal-notes";
import type {
  Database,
  ProjectMemberRole,
  ProjectStage,
} from "@/lib/supabase/types";

export interface PortalProjectSummary {
  readonly id: string;
  readonly name: string;
  readonly companyName: string;
  readonly stage: ProjectStage;
  readonly progressPercent: number;
  readonly role: ProjectMemberRole | null;
}

export async function listClientProjects(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PortalProjectSummary[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("project_memberships")
    .select("project_id,role")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error("Unable to load project memberships");
  }

  const projectIds = memberships.map((membership) => membership.project_id);
  if (projectIds.length === 0) {
    return [];
  }

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id,company_id,name,stage,progress_percent")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (projectError) {
    throw new Error("Unable to load projects");
  }

  const companyIds = [...new Set(projects.map((project) => project.company_id))];
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("id,name")
    .in("id", companyIds);

  if (companyError) {
    throw new Error("Unable to load project companies");
  }

  const companyNames = new Map(
    companies.map((company) => [company.id, company.name])
  );
  const roles = new Map(
    memberships.map((membership) => [
      membership.project_id,
      membership.role,
    ])
  );

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    companyName: companyNames.get(project.company_id) ?? "חברה",
    stage: project.stage,
    progressPercent: project.progress_percent,
    role: roles.get(project.id) ?? null,
  }));
}

export async function listOwnerProjects(
  supabase: SupabaseClient<Database>
): Promise<PortalProjectSummary[]> {
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id,company_id,name,stage,progress_percent")
    .order("created_at", { ascending: false });

  if (projectError) {
    throw new Error("Unable to load owner projects");
  }

  if (projects.length === 0) {
    return [];
  }

  const companyIds = [...new Set(projects.map((project) => project.company_id))];
  const { data: companies, error: companyError } = await supabase
    .from("companies")
    .select("id,name")
    .in("id", companyIds);

  if (companyError) {
    throw new Error("Unable to load owner companies");
  }

  const companyNames = new Map(
    companies.map((company) => [company.id, company.name])
  );

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    companyName: companyNames.get(project.company_id) ?? "חברה",
    stage: project.stage,
    progressPercent: project.progress_percent,
    role: null,
  }));
}

/**
 * The operator's private notes on a project, or the empty note when none exist yet.
 *
 * Returned as a value rather than `null` so the console has one shape to render: the
 * "nothing recorded" state is a property of the note, not a separate branch every caller
 * has to remember. RLS is what keeps this owner-only — a client's session simply matches
 * no row and receives the empty note, which reveals nothing.
 */
export async function getProjectInternalNotes(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<InternalNotesDefaults> {
  const { data, error } = await supabase
    .from("project_internal_notes")
    .select("impression,budget_signal,readiness,risks,flags")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load internal project notes");
  }
  if (!data) {
    return emptyInternalNotes;
  }

  return {
    impression: data.impression,
    budgetSignal: data.budget_signal,
    readiness: data.readiness,
    risks: data.risks,
    flags: data.flags,
  };
}
