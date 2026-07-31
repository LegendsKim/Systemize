import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ClientIntake =
  Database["public"]["Tables"]["client_intakes"]["Row"];
type MeetingSlot =
  Database["public"]["Tables"]["meeting_slots"]["Row"];
type PaymentRequest =
  Database["public"]["Tables"]["payment_requests"]["Row"];
type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];
type ProjectEvent =
  Database["public"]["Tables"]["project_events"]["Row"];
type ProjectInvitation =
  Database["public"]["Tables"]["project_invitations"]["Row"];

export interface ProjectInvitationSummary {
  readonly id: string;
  readonly projectId: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly status: ProjectInvitation["status"];
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly acceptedAt: string | null;
  readonly revokedAt: string | null;
}

export interface CompanyPersonSummary {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly activated: boolean;
}

export interface ProjectWorkflowSnapshot {
  readonly intake: ClientIntake | null;
  readonly meetingSlots: readonly MeetingSlot[];
  readonly payments: readonly PaymentRequest[];
}

const emptyWorkflow: ProjectWorkflowSnapshot = {
  intake: null,
  meetingSlots: [],
  payments: [],
};

export async function getProjectWorkflow(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ProjectWorkflowSnapshot> {
  const [intakeResult, slotsResult, paymentsResult] = await Promise.all([
    supabase
      .from("client_intakes")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("meeting_slots")
      .select("*")
      .eq("project_id", projectId)
      .order("starts_at", { ascending: true }),
    supabase
      .from("payment_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);

  if (intakeResult.error || slotsResult.error || paymentsResult.error) {
    throw new Error("Unable to load project workflow");
  }

  return {
    intake: intakeResult.data,
    meetingSlots: slotsResult.data,
    payments: paymentsResult.data,
  };
}

/**
 * The same snapshot as `getProjectWorkflow`, for every project at once.
 *
 * Three queries regardless of how many projects the viewer belongs to. Looping
 * `getProjectWorkflow` would be three round trips per project, which is invisible with
 * one project and indefensible with twenty — and the actions list needs all of them
 * before it can render a single row.
 */
export async function listProjectWorkflows(
  supabase: SupabaseClient<Database>,
  projectIds: readonly string[]
): Promise<ReadonlyMap<string, ProjectWorkflowSnapshot>> {
  if (projectIds.length === 0) {
    return new Map();
  }

  const ids = [...projectIds];
  const [intakesResult, slotsResult, paymentsResult] = await Promise.all([
    supabase.from("client_intakes").select("*").in("project_id", ids),
    supabase
      .from("meeting_slots")
      .select("*")
      .in("project_id", ids)
      .order("starts_at", { ascending: true }),
    supabase
      .from("payment_requests")
      .select("*")
      .in("project_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  if (intakesResult.error || slotsResult.error || paymentsResult.error) {
    throw new Error("Unable to load project workflows");
  }

  const workflows = new Map<string, ProjectWorkflowSnapshot>(
    ids.map((id) => [id, emptyWorkflow])
  );
  const slotsByProject = new Map<string, MeetingSlot[]>();
  const paymentsByProject = new Map<string, PaymentRequest[]>();

  for (const slot of slotsResult.data) {
    const bucket = slotsByProject.get(slot.project_id) ?? [];
    bucket.push(slot);
    slotsByProject.set(slot.project_id, bucket);
  }
  for (const payment of paymentsResult.data) {
    const bucket = paymentsByProject.get(payment.project_id) ?? [];
    bucket.push(payment);
    paymentsByProject.set(payment.project_id, bucket);
  }

  const intakes = new Map(
    intakesResult.data.map((intake) => [intake.project_id, intake])
  );

  for (const id of ids) {
    workflows.set(id, {
      intake: intakes.get(id) ?? null,
      meetingSlots: slotsByProject.get(id) ?? [],
      payments: paymentsByProject.get(id) ?? [],
    });
  }

  return workflows;
}

/**
 * The append-only history of a project, newest first.
 *
 * RLS already limits the rows to owners and active members, so the bound here is about
 * page weight rather than access: a project accumulates events forever, and no timeline
 * benefits from rendering all of them.
 */
export async function listProjectEvents(
  supabase: SupabaseClient<Database>,
  projectId: string,
  limit = 20
): Promise<readonly ProjectEvent[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await supabase
    .from("project_events")
    .select("*")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error("Unable to load project events");
  }
  return data;
}

export async function listProjectInvitations(
  supabase: SupabaseClient<Database>,
  projectId: string,
  limit = 25
): Promise<readonly ProjectInvitationSummary[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const { data: invitations, error: invitationError } = await supabase
    .from("project_invitations")
    .select(
      "id,project_id,person_id,email,status,created_at,expires_at,accepted_at,revoked_at"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (invitationError) {
    throw new Error("Unable to load project invitations");
  }

  if (invitations.length === 0) {
    return [];
  }

  const personIds = [...new Set(invitations.map((item) => item.person_id))];
  const { data: people, error: peopleError } = await supabase
    .from("company_people")
    .select("id,full_name,phone")
    .in("id", personIds);

  if (peopleError) {
    throw new Error("Unable to load invitation recipients");
  }

  const personDetails = new Map(
    people.map((person) => [
      person.id,
      { fullName: person.full_name, phone: person.phone },
    ])
  );

  return invitations.map((invitation) => ({
    id: invitation.id,
    projectId: invitation.project_id,
    fullName:
      personDetails.get(invitation.person_id)?.fullName ?? "לקוח פוטנציאלי",
    email: invitation.email,
    phone: personDetails.get(invitation.person_id)?.phone ?? "",
    status: invitation.status,
    createdAt: invitation.created_at,
    expiresAt: invitation.expires_at,
    acceptedAt: invitation.accepted_at,
    revokedAt: invitation.revoked_at,
  }));
}

export async function listCompanyPeople(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<readonly CompanyPersonSummary[]> {
  const { data, error } = await supabase
    .from("company_people")
    .select("id,full_name,email,phone,user_id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error("Unable to load company people");
  }

  return data.map((person) => ({
    id: person.id,
    fullName: person.full_name,
    email: person.email,
    phone: person.phone,
    activated: person.user_id !== null,
  }));
}

/**
 * How many notifications the operator has not opened yet.
 *
 * A count rather than a list: the admin chrome only needs the number, and asking the
 * database for rows it will immediately discard is the sort of thing that is invisible at
 * one project and expensive at two hundred. `head: true` sends no rows over the wire.
 */
export async function countUnreadNotifications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", userId)
    .is("read_at", null);

  if (error) {
    throw new Error("Unable to count notifications");
  }
  return count ?? 0;
}

export async function listUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 8
): Promise<readonly Notification[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 25);
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error("Unable to load notifications");
  }
  return data;
}
