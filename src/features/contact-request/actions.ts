"use server";

import { contactRequestSchema } from "./schemas";
import type { ContactRequestResult } from "./types";
import { createDevLogger } from "@/lib/observability/dev-logger";
import { SupabaseRateLimiter } from "@/lib/network/supabase-rate-limit";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  DuplicateContactRequestError,
  getContactRequestRepository,
} from "@/server/repositories/contact-request.repository";
import { createNotificationProvider } from "@/server/adapters/notification";

// ---------------------------------------------------------------------------
// Dependencies — in production these come from DI / config
// ---------------------------------------------------------------------------

const logger = createDevLogger();

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

let rateLimiter: SupabaseRateLimiter | null = null;
function getRateLimiter(): SupabaseRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new SupabaseRateLimiter(getAdminSupabaseClient());
  }
  return rateLimiter;
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function submitContactRequest(
  idempotencyKey: string,
  formData: FormData
): Promise<ContactRequestResult> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      return { status: "error", message: "Invalid submission identifier." };
    }

    // 1. Parse and validate
    const rawData = Object.fromEntries(formData.entries());
    const validation = contactRequestSchema.safeParse(rawData);

    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          if (!fieldErrors[field]) fieldErrors[field] = [];
          fieldErrors[field].push(issue.message);
        }
      }
      return { status: "validation_error", errors: fieldErrors };
    }

    // 2. Rate limit check
    const rateLimitResult = await getRateLimiter().check(
      `contact:${validation.data.email}`,
      RATE_LIMIT,
      RATE_WINDOW_MS
    );
    if (!rateLimitResult.allowed) {
      return {
        status: "rate_limited",
        retryAfterMs: rateLimitResult.retryAfterMs,
      };
    }

    const repository = getContactRequestRepository();

    // 3. Idempotency check — return existing record if found
    const existing = await repository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return { status: "duplicate", id: existing.id };
    }

    // 4. Persist to database
    let record;
    try {
      record = await repository.create({
        name: validation.data.name,
        email: validation.data.email,
        message: validation.data.message,
        idempotency_key: idempotencyKey,
      });
    } catch (error: unknown) {
      if (error instanceof DuplicateContactRequestError) {
        const duplicate = await repository.findByIdempotencyKey(idempotencyKey);
        if (duplicate) {
          return { status: "duplicate", id: duplicate.id };
        }
      }
      throw error;
    }

    // 5. Best-effort notification — persistence already succeeded
    try {
      const notifier = createNotificationProvider();
      const delivery = await notifier.send({
        type: "contact_request",
        subject: "New contact request",
        body: "A new contact request is ready for review.",
        metadata: { recordId: record.id },
      });
      if (!delivery.success) {
        throw new Error(delivery.error?.category ?? "notification_failed");
      }
      await repository.updateStatus(record.id, "notified");
    } catch (notificationError: unknown) {
      // Notification failure must NOT delete or roll back the durable record
      const errorMessage =
        notificationError instanceof Error
          ? notificationError.message
          : String(notificationError);

      logger.error("Contact request notification failed", {
        category: "notification",
        provider: "console",
      });
      await repository.updateStatus(record.id, "failed", errorMessage);
    }

    // 6. Log success (no PII — don't log email, name, or message content)
    logger.info("Contact request submitted", {
      action: "submitContactRequest",
      category: "contact",
    });

    return { status: "success", id: record.id };
  } catch (_error: unknown) {
    logger.error("Unexpected error in submitContactRequest", {
      action: "submitContactRequest",
      category: "internal",
    });
    return { status: "error", message: "An unexpected error occurred. Please try again." };
  }
}
