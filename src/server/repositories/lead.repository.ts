import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DuplicateLeadError,
  type CreateLeadInput,
  type LeadRecord,
  type LeadRepository,
} from "@/features/lead/lead-types";

/**
 * The only write path to `public.leads`.
 *
 * `leads` is deny-by-default with RLS enabled and no policies, and `anon` holds no
 * grant on it (supabase/migrations/00002_leads.sql). The anonymous visitor's insert
 * therefore reaches the table only through here, on the service-role client, from a
 * Server Action that has already validated and rate-limited the request.
 *
 * There is no update and no delete method, by design.
 */

type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

/** PostgreSQL `unique_violation`. */
const UNIQUE_VIOLATION = "23505";

/** Selected explicitly so a future column cannot start leaking through `select()`. */
const LEAD_COLUMNS =
  "id, created_at, full_name, business_name, phone, email, message, idempotency_key, request_id";

export class SupabaseLeadRepository implements LeadRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(input: CreateLeadInput): Promise<LeadRecord> {
    // Built field by field: `id` and `created_at` are never sent, so the database
    // generates both no matter what reached the Server Action.
    const insert: LeadInsert = {
      full_name: input.full_name,
      business_name: input.business_name,
      phone: input.phone,
      email: input.email,
      message: input.message,
      idempotency_key: input.idempotency_key,
      request_id: input.request_id,
    };

    const { data, error } = await this.supabase
      .from("leads")
      .insert(insert)
      .select(LEAD_COLUMNS)
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new DuplicateLeadError();
      }
      // The Supabase message can quote the offending row, which is PII. Only the
      // code is carried forward.
      throw new Error(`Failed to insert lead (code ${error.code ?? "unknown"})`);
    }

    return data;
  }

  async findByIdempotencyKey(key: string): Promise<LeadRecord | null> {
    const { data, error } = await this.supabase
      .from("leads")
      .select(LEAD_COLUMNS)
      .eq("idempotency_key", key)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to read lead by idempotency key (code ${error.code ?? "unknown"})`);
    }

    return data ?? null;
  }
}

/**
 * The console's read path for `public.leads`.
 *
 * Deliberately takes the caller's request-scoped client rather than reusing the
 * service-role client above. The service-role client bypasses RLS, so reading leads
 * through it would make the `leads_owner_read` policy decorative and leave authorization
 * resting on nothing but this function being called from the right place. Passing the
 * signed-in client means the database refuses the rows for anyone who is not the
 * SYSTEMIZE owner, whatever the calling page believes.
 */
export async function listLeadsForOwner(
  supabase: SupabaseClient<Database>,
  limit = 100
): Promise<readonly LeadRecord[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    // The message can quote the offending row, which is PII. Only the code travels.
    throw new Error(`Failed to list leads (code ${error.code ?? "unknown"})`);
  }

  return data;
}

let repository: LeadRepository | null = null;

export function getLeadRepository(): LeadRepository {
  if (!repository) {
    repository = new SupabaseLeadRepository(getAdminSupabaseClient());
  }
  return repository;
}
