import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContactRequestInsert = Database["public"]["Tables"]["contact_requests"]["Insert"];
type ContactRequestUpdate = Database["public"]["Tables"]["contact_requests"]["Update"];

export interface ContactRequestRecord {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  message: string;
  idempotency_key: string;
  status: string;
  notification_error: string | null;
  ip_address: string | null;
  user_id: string | null;
}

export interface CreateContactRequestInput {
  name: string;
  email: string;
  message: string;
  idempotency_key: string;
  ip_address?: string | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ContactRequestRepository {
  create(input: CreateContactRequestInput): Promise<ContactRequestRecord>;
  findByIdempotencyKey(key: string): Promise<ContactRequestRecord | null>;
  updateStatus(
    id: string,
    status: string,
    notificationError?: string
  ): Promise<void>;
}

export class DuplicateContactRequestError extends Error {
  constructor() {
    super("Duplicate contact request");
    this.name = "DuplicateContactRequestError";
  }
}

// ---------------------------------------------------------------------------
// Supabase Implementation
// ---------------------------------------------------------------------------

export class SupabaseContactRequestRepository
  implements ContactRequestRepository
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(
    input: CreateContactRequestInput
  ): Promise<ContactRequestRecord> {
    const insertData: ContactRequestInsert = {
      name: input.name,
      email: input.email,
      message: input.message,
      idempotency_key: input.idempotency_key,
      ip_address: input.ip_address ?? null,
      user_id: input.user_id ?? null,
      status: "pending",
    };

    const { data, error } = await this.supabase
      .from("contact_requests")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new DuplicateContactRequestError();
      }
      throw new Error(`Failed to create contact request: ${error.message}`);
    }

    return data as ContactRequestRecord;
  }

  async findByIdempotencyKey(
    key: string
  ): Promise<ContactRequestRecord | null> {
    const { data, error } = await this.supabase
      .from("contact_requests")
      .select()
      .eq("idempotency_key", key)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to find contact request by idempotency key: ${error.message}`
      );
    }

    return data ? (data as ContactRequestRecord) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    notificationError?: string
  ): Promise<void> {
    const updateData: ContactRequestUpdate = {
      status: status as "pending" | "notified" | "failed",
      ...(notificationError !== undefined
        ? { notification_error: notificationError }
        : {}),
    };

    const { error } = await this.supabase
      .from("contact_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(
        `Failed to update contact request status: ${error.message}`
      );
    }
  }
}

let repository: ContactRequestRepository | null = null;

export function getContactRequestRepository(): ContactRequestRepository {
  if (!repository) {
    repository = new SupabaseContactRequestRepository(
      getAdminSupabaseClient()
    );
  }
  return repository;
}
