import type { Logger } from "@/lib/observability/logger";
import type { RateLimiter } from "@/lib/network/rate-limit";
import type {
  Notification,
  NotificationProvider,
} from "@/server/adapters/notification";
import { parseLeadFormData, idempotencyKeySchema, toFieldErrors } from "./lead-schemas";
import {
  DuplicateLeadError,
  type LeadRecord,
  type LeadRepository,
  type LeadResult,
} from "./lead-types";

/**
 * Lead submission, as one readable sequence with its dependencies injected.
 *
 * The Server Action in `actions.ts` supplies the real repository, notifier, limiter
 * and request-derived values; the tests supply fakes. That is what makes the three
 * critical journeys (docs/PRODUCT.md §4) testable without a database or a bot token.
 *
 * The invariant this file exists to protect: the lead is durably persisted **before**
 * any notification is attempted, and no notification outcome can delete the row, roll
 * it back, or turn the visitor's success into an error.
 */

/** AGENTS.client.md §6: 5 requests per IP per hour, database-backed. */
export const LEAD_RATE_LIMIT = 5;
export const LEAD_RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * How long a best-effort notification may hold a visitor's submission open. Past this
 * the send is aborted and the visitor gets their success; the owner still has the row.
 */
export const NOTIFICATION_BUDGET_MS = 6_000;

export interface LeadSubmissionDeps {
  readonly repository: LeadRepository;
  /**
   * A factory, not an instance, and it is called only after the lead is durable.
   *
   * Provider selection throws when a production deployment has no credentials, that
   * guard has to stay loud, but it must not be able to cost a lead. Resolving the
   * provider here means a misconfigured deployment persists the lead, shows the
   * visitor success, and logs an error on every submission, instead of failing the
   * submission outright.
   */
  readonly createNotifier: () => NotificationProvider;
  readonly rateLimiter: RateLimiter;
  readonly logger: Logger;
  /**
   * The rate-limit subject, derived on the server from request headers. Never taken
   * from the client payload, and never logged, it identifies the visitor.
   */
  readonly rateLimitSubject: string;
  /** Server-generated correlation id, stored on the row and safe to log. */
  readonly requestId: string;
  readonly notificationBudgetMs?: number;
}

export async function submitLead(
  idempotencyKey: string,
  formData: FormData,
  deps: LeadSubmissionDeps
): Promise<LeadResult> {
  const { logger, requestId } = deps;

  try {
    // 1. The idempotency key is a database key. Its shape is checked before use.
    if (!idempotencyKeySchema.safeParse(idempotencyKey).success) {
      logger.warn("Lead submission rejected: malformed idempotency key", {
        action: "submitLead",
        category: "validation",
        requestId,
      });
      return { status: "error" };
    }

    // 2. Replay check first. A visitor whose response was lost and who submits again
    //    must not spend rate-limit budget on a request that will not write anything.
    const existing = await deps.repository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      logger.info("Lead submission replayed; no second row and no second notification", {
        action: "submitLead",
        category: "idempotency",
        requestId,
        leadId: existing.id,
      });
      return { status: "duplicate", id: existing.id };
    }

    // 3. Validation. The server is the authority; the client's identical check only
    //    saves a round trip.
    const parsed = parseLeadFormData(formData);
    if (!parsed.success) {
      logger.info("Lead submission failed validation", {
        action: "submitLead",
        category: "validation",
        requestId,
        // Field names only. Never the values.
        fields: Object.keys(toFieldErrors(parsed.error)),
      });
      return { status: "validation_error", errors: toFieldErrors(parsed.error) };
    }

    // 4. Distributed rate limit, keyed on the server-derived subject.
    const rateLimit = await deps.rateLimiter.check(
      `lead:${deps.rateLimitSubject}`,
      LEAD_RATE_LIMIT,
      LEAD_RATE_WINDOW_MS
    );
    if (!rateLimit.allowed) {
      logger.warn("Lead submission rate limited", {
        action: "submitLead",
        category: "rate_limit",
        requestId,
      });
      return {
        status: "rate_limited",
        ...(rateLimit.retryAfterMs !== undefined
          ? { retryAfterMs: rateLimit.retryAfterMs }
          : {}),
      };
    }

    // 5. Durable write. Everything after this point is best-effort.
    let lead: LeadRecord;
    try {
      lead = await deps.repository.create({
        full_name: parsed.data.full_name,
        business_name: parsed.data.business_name,
        phone: parsed.data.phone,
        email: parsed.data.email,
        message: parsed.data.message,
        idempotency_key: idempotencyKey,
        request_id: requestId,
      });
    } catch (error: unknown) {
      // Two submissions of the same key can race past step 2. The unique constraint
      // settles it, and the loser reads the winner's row.
      if (error instanceof DuplicateLeadError) {
        const winner = await deps.repository.findByIdempotencyKey(idempotencyKey);
        if (winner) {
          logger.info("Concurrent lead submissions resolved to one row", {
            action: "submitLead",
            category: "idempotency",
            requestId,
            leadId: winner.id,
          });
          return { status: "duplicate", id: winner.id };
        }
      }
      throw error;
    }

    logger.info("Lead persisted", {
      action: "submitLead",
      category: "persistence",
      requestId,
      leadId: lead.id,
    });

    // 6. Notify the owner. Failure is logged and swallowed.
    await notifyOwner(lead, deps);

    return { status: "success", id: lead.id };
  } catch (error: unknown) {
    // The error itself is not logged: a Postgres or provider message can quote the
    // offending row, and that row is PII.
    logger.error("Lead submission failed unexpectedly", {
      action: "submitLead",
      category: "internal",
      requestId,
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error" };
  }
}

/* -------------------------------------------------------------------------- */
/* Notification, best effort, bounded, and never able to fail the submission  */
/* -------------------------------------------------------------------------- */

async function notifyOwner(lead: LeadRecord, deps: LeadSubmissionDeps): Promise<void> {
  const budgetMs = deps.notificationBudgetMs ?? NOTIFICATION_BUDGET_MS;
  const controller = new AbortController();
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    const send = deps.createNotifier().send(buildNotification(lead), {
      signal: controller.signal,
    });
    // A rejection that arrives after the deadline wins the race must not surface as
    // an unhandled rejection.
    send.catch(() => undefined);

    const deadline = new Promise<"deadline_exceeded">((resolve) => {
      deadlineTimer = setTimeout(() => {
        // Settle the race before aborting: an abort makes the send reject, and the
        // deadline is the more accurate description of what happened.
        resolve("deadline_exceeded");
        controller.abort();
      }, budgetMs);
    });

    const outcome = await Promise.race([send, deadline]);

    if (outcome === "deadline_exceeded") {
      deps.logger.error("Lead notification exceeded its budget; lead is stored", {
        action: "submitLead",
        category: "notification",
        requestId: deps.requestId,
        leadId: lead.id,
        durationMs: budgetMs,
      });
      return;
    }

    if (!outcome.success) {
      deps.logger.error("Lead notification failed; lead is stored", {
        action: "submitLead",
        category: "notification",
        requestId: deps.requestId,
        leadId: lead.id,
        // A normalised category, not the provider's prose.
        failure: outcome.error?.category ?? "unknown",
      });
      return;
    }

    deps.logger.info("Lead notification delivered", {
      action: "submitLead",
      category: "notification",
      requestId: deps.requestId,
      leadId: lead.id,
    });
  } catch (error: unknown) {
    // Includes an unconfigured provider in production: loud in the logs, invisible to
    // the visitor, and harmless to the stored row.
    deps.logger.error("Lead notification could not be delivered; lead is stored", {
      action: "submitLead",
      category: "notification",
      requestId: deps.requestId,
      leadId: lead.id,
      errorName: error instanceof Error ? error.name : "unknown",
    });
  } finally {
    if (deadlineTimer) clearTimeout(deadlineTimer);
    controller.abort();
  }
}

/**
 * The owner cannot act on a lead without the contact details, so the message carries
 * them, and nothing else. This is the notification, not a log line: no PII from here
 * ever reaches `logger`.
 */
function buildNotification(lead: LeadRecord): Notification {
  return {
    type: "lead_received",
    subject: "ליד חדש מהאתר",
    body: [
      `שם: ${lead.full_name}`,
      `עסק: ${lead.business_name}`,
      `טלפון: ${lead.phone}`,
      `אימייל: ${lead.email}`,
      "",
      "מה הם כתבו:",
      lead.message,
    ].join("\n"),
    metadata: { leadId: lead.id, requestId: lead.request_id },
  };
}
