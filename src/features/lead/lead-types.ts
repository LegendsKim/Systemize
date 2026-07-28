import type { LeadFieldErrors } from "./lead-schemas";

/**
 * The lead feature's contracts: the result the Server Action returns, and the
 * repository port the server implementation satisfies.
 *
 * Deliberately free of server-only imports. The client form needs the result union,
 * and the orchestration in `lead-service.ts` needs the port, neither should have to
 * pull the Supabase admin client into its import graph to get a type.
 */

/* -------------------------------------------------------------------------- */
/* Result union                                                                */
/* -------------------------------------------------------------------------- */

/** Persisted, and the notification was attempted (its outcome is not the visitor's). */
export interface LeadSuccess {
  status: "success";
  id: string;
}

/** The same idempotency key arrived again. Exactly one row, exactly one notification. */
export interface LeadDuplicate {
  status: "duplicate";
  id: string;
}

export interface LeadValidationError {
  status: "validation_error";
  errors: LeadFieldErrors;
}

export interface LeadRateLimited {
  status: "rate_limited";
  retryAfterMs?: number;
}

/** Anything unexpected. Carries no provider detail and no PII. */
export interface LeadFailure {
  status: "error";
}

export type LeadResult =
  | LeadSuccess
  | LeadDuplicate
  | LeadValidationError
  | LeadRateLimited
  | LeadFailure;

/* -------------------------------------------------------------------------- */
/* Repository port                                                             */
/* -------------------------------------------------------------------------- */

export interface LeadRecord {
  readonly id: string;
  readonly created_at: string;
  readonly full_name: string;
  readonly business_name: string;
  readonly phone: string;
  readonly email: string;
  readonly message: string;
  readonly idempotency_key: string;
  readonly request_id: string;
}

/**
 * What the server is allowed to write. `id` and `created_at` are absent by
 * construction: the database generates them, so no caller can supply one.
 */
export interface CreateLeadInput {
  readonly full_name: string;
  readonly business_name: string;
  readonly phone: string;
  readonly email: string;
  readonly message: string;
  readonly idempotency_key: string;
  /** Server-generated correlation id. */
  readonly request_id: string;
}

/**
 * No update and no delete. The port cannot express a lead deletion, which is how
 * "application code never hard-deletes a lead" is enforced in TypeScript as well as
 * in the database grants.
 */
export interface LeadRepository {
  create(input: CreateLeadInput): Promise<LeadRecord>;
  findByIdempotencyKey(key: string): Promise<LeadRecord | null>;
}

/** Raised when the unique constraint on `idempotency_key` rejects an insert. */
export class DuplicateLeadError extends Error {
  constructor() {
    super("Lead with this idempotency key already exists");
    this.name = "DuplicateLeadError";
  }
}
