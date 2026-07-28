"use server";

import { headers } from "next/headers";
import { SupabaseRateLimiter } from "@/lib/network/supabase-rate-limit";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerLogger } from "@/lib/observability/server-logger";
import { REQUEST_ID_HEADER, generateRequestId } from "@/lib/observability/request-id";
import { createNotificationProvider } from "@/server/adapters/notification";
import { getLeadRepository } from "@/server/repositories/lead.repository";
import { submitLead as runSubmission } from "./lead-service";
import type { LeadResult } from "./lead-types";

/**
 * The lead form's Server Action.
 *
 * Its whole job is to bind request-scoped facts, the caller's address, the request
 * id, and the real adapters to the orchestration in `lead-service.ts`. The rules
 * live there; the wiring lives here.
 *
 * Origin protection comes from Next.js's built-in Server Action origin check
 * (AGENTS.md §6), and every dependency below is constructed lazily.
 */

// Stays observable in production, unlike the development logger.
const logger = createServerLogger();

let rateLimiter: SupabaseRateLimiter | null = null;
function getRateLimiter(): SupabaseRateLimiter {
  rateLimiter ??= new SupabaseRateLimiter(getAdminSupabaseClient());
  return rateLimiter;
}

/**
 * The rate-limit subject, derived on the server from the request headers only.
 *
 * A client-supplied address is never consulted. `x-vercel-forwarded-for` is preferred
 * because the platform sets it and a caller cannot forge it; the first hop of
 * `x-forwarded-for` is the fallback for other hosts and for local development.
 *
 * The value is passed to `public.check_rate_limit`, which SHA-256 hashes it before it
 * touches a row, so no address is ever stored. It is never logged.
 */
function deriveRateLimitSubject(requestHeaders: Headers): string {
  const candidate =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0] ??
    requestHeaders.get("x-real-ip") ??
    "";

  const address = candidate.trim();
  return address.length > 0 && address.length <= 64 ? address : "unattributed";
}

export async function submitLead(
  idempotencyKey: string,
  formData: FormData
): Promise<LeadResult> {
  const requestHeaders = await headers();
  const incomingRequestId = requestHeaders.get(REQUEST_ID_HEADER);

  return runSubmission(idempotencyKey, formData, {
    repository: getLeadRepository(),
    createNotifier: createNotificationProvider,
    rateLimiter: getRateLimiter(),
    logger,
    rateLimitSubject: deriveRateLimitSubject(requestHeaders),
    // Generated on the server. A client-supplied correlation id is only honoured when
    // the proxy has already validated its shape (src/proxy.ts).
    requestId:
      incomingRequestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingRequestId)
        ? incomingRequestId
        : generateRequestId(),
  });
}
