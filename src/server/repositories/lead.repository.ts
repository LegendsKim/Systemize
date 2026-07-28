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

let repository: LeadRepository | null = null;

export function getLeadRepository(): LeadRepository {
  if (!repository) {
    repository = new SupabaseLeadRepository(getAdminSupabaseClient());
  }
  return repository;
}
