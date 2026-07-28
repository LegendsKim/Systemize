import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryRateLimiter, type RateLimiter } from "@/lib/network/rate-limit";
import type { LogContext, Logger } from "@/lib/observability/logger";
import type {
  Notification,
  NotificationProvider,
  NotificationResult,
  SendOptions,
} from "@/server/adapters/notification";
import {
  LEAD_RATE_LIMIT,
  submitLead,
  type LeadSubmissionDeps,
} from "../lead-service";
import {
  DuplicateLeadError,
  type CreateLeadInput,
  type LeadRecord,
  type LeadRepository,
} from "../lead-types";

/**
 * The three critical journeys of docs/PRODUCT.md §4, plus the rate-limit and
 * PII-in-logs acceptance criteria, exercised against fakes.
 *
 * Deterministic by construction: no clock, no network, no database, no timers that
 * have to be advanced.
 */

/* -------------------------------------------------------------------------- */
/* Fakes                                                                       */
/* -------------------------------------------------------------------------- */

const PII = {
  full_name: "דנה לוי",
  business_name: "מעבדות אריאל",
  phone: "050-1234567",
  email: "dana@example.co.il",
  message: "כל הזמנה עוברת דרך שלושה קבצי אקסל ואף אחד לא יודע מה המצב.",
};

const KEY = "6f9619ff-8b86-4d01-b42d-00cf4fc964ff";

/** Enforces the same unique constraint the database does. */
class FakeLeadRepository implements LeadRepository {
  readonly rows: LeadRecord[] = [];
  createCalls = 0;
  /** Set to make the very next insert lose an idempotency-key race. */
  simulateRaceLoss = false;

  async create(input: CreateLeadInput): Promise<LeadRecord> {
    this.createCalls += 1;

    if (this.simulateRaceLoss) {
      this.simulateRaceLoss = false;
      // The winner's row lands without going through this method, exactly as another
      // process's committed insert would.
      this.rows.push(this.toRow(input, "winner-id"));
      throw new DuplicateLeadError();
    }

    if (this.rows.some((row) => row.idempotency_key === input.idempotency_key)) {
      throw new DuplicateLeadError();
    }

    const row = this.toRow(input, `lead-${this.rows.length + 1}`);
    this.rows.push(row);
    return row;
  }

  async findByIdempotencyKey(key: string): Promise<LeadRecord | null> {
    return this.rows.find((row) => row.idempotency_key === key) ?? null;
  }

  private toRow(input: CreateLeadInput, id: string): LeadRecord {
    // `id` and `created_at` are generated here, never taken from the caller, the
    // database does the same.
    return { ...input, id, created_at: "2026-07-26T00:00:00.000Z" };
  }
}

class FakeNotifier implements NotificationProvider {
  readonly sent: Notification[] = [];
  readonly signals: (AbortSignal | undefined)[] = [];
  mode: "deliver" | "reject" | "throw" = "deliver";

  async send(
    notification: Notification,
    options: SendOptions = {}
  ): Promise<NotificationResult> {
    this.sent.push(notification);
    this.signals.push(options.signal);

    if (this.mode === "throw") {
      throw new Error("telegram is unreachable");
    }
    if (this.mode === "reject") {
      return {
        success: false,
        error: { category: "transient_failure", message: "502 from Telegram" },
      };
    }
    return { success: true, providerId: "fake" };
  }
}

interface LogLine {
  level: string;
  message: string;
  context?: LogContext;
}

class RecordingLogger implements Logger {
  readonly lines: LogLine[] = [];

  debug(message: string, context?: LogContext) {
    this.lines.push({ level: "debug", message, ...(context ? { context } : {}) });
  }
  info(message: string, context?: LogContext) {
    this.lines.push({ level: "info", message, ...(context ? { context } : {}) });
  }
  warn(message: string, context?: LogContext) {
    this.lines.push({ level: "warn", message, ...(context ? { context } : {}) });
  }
  error(message: string, context?: LogContext) {
    this.lines.push({ level: "error", message, ...(context ? { context } : {}) });
  }
  captureException(error: unknown, context?: LogContext) {
    this.lines.push({ level: "error", message: String(error), ...(context ? { context } : {}) });
  }

  serialize(): string {
    return JSON.stringify(this.lines);
  }
}

/** A limiter that refuses everything, without needing to burn a real window. */
const exhaustedLimiter: RateLimiter = {
  async check() {
    return { allowed: false, retryAfterMs: 1_800_000, remaining: 0 };
  },
};

function leadFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries({ ...PII, ...overrides })) {
    formData.set(key, value);
  }
  return formData;
}

let repository: FakeLeadRepository;
let notifier: FakeNotifier;
let logger: RecordingLogger;

function deps(overrides: Partial<LeadSubmissionDeps> = {}): LeadSubmissionDeps {
  return {
    repository,
    createNotifier: () => notifier,
    logger,
    rateLimiter: new InMemoryRateLimiter(),
    rateLimitSubject: "203.0.113.7",
    requestId: "req-test-1",
    ...overrides,
  };
}

beforeEach(() => {
  repository = new FakeLeadRepository();
  notifier = new FakeNotifier();
  logger = new RecordingLogger();
});

/* -------------------------------------------------------------------------- */
/* J1, submit a lead                                                          */
/* -------------------------------------------------------------------------- */

describe("J1, a valid submission is persisted and notified", () => {
  it("persists exactly one row and notifies once", async () => {
    const result = await submitLead(KEY, leadFormData(), deps());

    expect(result).toEqual({ status: "success", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it("generates the correlation id on the server and ignores a client-supplied one", async () => {
    await submitLead(
      KEY,
      leadFormData({ request_id: "forged", id: "forged", created_at: "1999-01-01" }),
      deps({ requestId: "req-server-generated" })
    );

    const row = repository.rows[0]!;
    expect(row.request_id).toBe("req-server-generated");
    expect(row.id).toBe("lead-1");
    expect(row.created_at).toBe("2026-07-26T00:00:00.000Z");
  });

  it("returns field-level Hebrew errors and writes nothing when input is invalid", async () => {
    const result = await submitLead(KEY, leadFormData({ email: "not-an-email" }), deps());

    expect(result.status).toBe("validation_error");
    if (result.status !== "validation_error") return;
    expect(result.errors.email?.[0]).toContain("אימייל");
    expect(repository.rows).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("rejects a malformed idempotency key without touching the database", async () => {
    const result = await submitLead("not-a-uuid", leadFormData(), deps());

    expect(result).toEqual({ status: "error" });
    expect(repository.createCalls).toBe(0);
  });

  it("gives the notification a deadline signal it can be aborted with", async () => {
    await submitLead(KEY, leadFormData(), deps());
    expect(notifier.signals[0]).toBeInstanceOf(AbortSignal);
  });

  it("keeps every lead field out of the logs", async () => {
    await submitLead(KEY, leadFormData(), deps());

    const logged = logger.serialize();
    for (const value of Object.values(PII)) {
      expect(logged).not.toContain(value);
    }
    // Nor the visitor's address, which is PII the limiter needs but logs must not have.
    expect(logged).not.toContain("203.0.113.7");
    // The safe correlation fields are present.
    expect(logged).toContain("req-test-1");
    expect(logged).toContain("lead-1");
  });

  it("keeps lead PII out of the logs on the validation path too", async () => {
    await submitLead(KEY, leadFormData({ message: "too short" }), deps());
    expect(logger.serialize()).not.toContain("too short");
    expect(logger.serialize()).toContain("message");
  });
});

/* -------------------------------------------------------------------------- */
/* J2, duplicate submission is safe                                           */
/* -------------------------------------------------------------------------- */

describe("J2, a replayed idempotency key is safe", () => {
  it("creates one row and sends one notification across two identical submissions", async () => {
    const first = await submitLead(KEY, leadFormData(), deps());
    const second = await submitLead(KEY, leadFormData(), deps());

    expect(first).toEqual({ status: "success", id: "lead-1" });
    expect(second).toEqual({ status: "duplicate", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
    expect(repository.createCalls).toBe(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it("does not spend rate-limit budget on a replay", async () => {
    const rateLimiter = new InMemoryRateLimiter();
    const shared = deps({ rateLimiter });

    await submitLead(KEY, leadFormData(), shared);
    for (let attempt = 0; attempt < LEAD_RATE_LIMIT + 2; attempt += 1) {
      const replay = await submitLead(KEY, leadFormData(), shared);
      expect(replay.status).toBe("duplicate");
    }

    expect(repository.rows).toHaveLength(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it("resolves a lost race to the row the winner committed", async () => {
    repository.simulateRaceLoss = true;

    const result = await submitLead(KEY, leadFormData(), deps());

    expect(result).toEqual({ status: "duplicate", id: "winner-id" });
    expect(repository.rows).toHaveLength(1);
    // The loser must not notify: the winner already did.
    expect(notifier.sent).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/* J3, notification failure never loses the lead                              */
/* -------------------------------------------------------------------------- */

describe("J3, the lead survives every notification failure", () => {
  it("keeps the row and reports success when the provider returns a failure", async () => {
    notifier.mode = "reject";

    const result = await submitLead(KEY, leadFormData(), deps());

    expect(result).toEqual({ status: "success", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
    expect(
      logger.lines.some(
        (line) => line.level === "error" && line.context?.category === "notification"
      )
    ).toBe(true);
  });

  it("keeps the row and reports success when the provider throws", async () => {
    notifier.mode = "throw";

    const result = await submitLead(KEY, leadFormData(), deps());

    expect(result).toEqual({ status: "success", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
  });

  it("records the failure without any lead PII", async () => {
    notifier.mode = "reject";
    await submitLead(KEY, leadFormData(), deps());

    const logged = logger.serialize();
    for (const value of Object.values(PII)) {
      expect(logged).not.toContain(value);
    }
    expect(logged).toContain("transient_failure");
  });

  it("returns without waiting when the notification exceeds its budget", async () => {
    const stalling: NotificationProvider = {
      send: (_notification, options = {}) =>
        new Promise<NotificationResult>((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    };

    const result = await submitLead(
      KEY,
      leadFormData(),
      deps({ createNotifier: () => stalling, notificationBudgetMs: 5 })
    );

    expect(result).toEqual({ status: "success", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
    expect(
      logger.lines.some((line) => line.message.includes("exceeded its budget"))
    ).toBe(true);
  });

  it("keeps the lead when the provider cannot even be constructed", async () => {
    // What a production deployment with no Telegram credentials does: the selection
    // guard throws. It must be loud in the logs and invisible to the visitor.
    const unconfigured = () => {
      throw new Error("No notification provider is configured.");
    };

    const result = await submitLead(
      KEY,
      leadFormData(),
      deps({ createNotifier: unconfigured })
    );

    expect(result).toEqual({ status: "success", id: "lead-1" });
    expect(repository.rows).toHaveLength(1);
    expect(
      logger.lines.some(
        (line) => line.level === "error" && line.context?.category === "notification"
      )
    ).toBe(true);
  });

  it("notifies only after the row is durable", async () => {
    const order: string[] = [];
    const observing: NotificationProvider = {
      async send() {
        order.push(`notify:rows=${repository.rows.length}`);
        return { success: true };
      },
    };

    await submitLead(KEY, leadFormData(), deps({ createNotifier: () => observing }));

    expect(order).toEqual(["notify:rows=1"]);
  });
});

/* -------------------------------------------------------------------------- */
/* Rate limiting, AGENTS.client.md §6                                         */
/* -------------------------------------------------------------------------- */

describe("rate limiting", () => {
  it("returns a typed rate-limited state instead of a generic error", async () => {
    const result = await submitLead(
      KEY,
      leadFormData(),
      deps({ rateLimiter: exhaustedLimiter })
    );

    expect(result).toEqual({ status: "rate_limited", retryAfterMs: 1_800_000 });
    expect(repository.rows).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("allows five submissions per subject and refuses the sixth", async () => {
    const rateLimiter = new InMemoryRateLimiter();
    const statuses: string[] = [];

    for (let attempt = 0; attempt < LEAD_RATE_LIMIT + 1; attempt += 1) {
      const result = await submitLead(
        `6f9619ff-8b86-4d01-b42d-00cf4fc9640${attempt}`,
        leadFormData(),
        deps({ rateLimiter })
      );
      statuses.push(result.status);
    }

    expect(statuses).toEqual([
      ...Array.from({ length: LEAD_RATE_LIMIT }, () => "success"),
      "rate_limited",
    ]);
    expect(repository.rows).toHaveLength(LEAD_RATE_LIMIT);
  });

  it("keys the limit on the subject, so a second visitor is unaffected", async () => {
    const rateLimiter = new InMemoryRateLimiter();

    for (let attempt = 0; attempt < LEAD_RATE_LIMIT; attempt += 1) {
      await submitLead(
        `6f9619ff-8b86-4d01-b42d-00cf4fc9641${attempt}`,
        leadFormData(),
        deps({ rateLimiter, rateLimitSubject: "198.51.100.1" })
      );
    }

    const other = await submitLead(
      KEY,
      leadFormData(),
      deps({ rateLimiter, rateLimitSubject: "198.51.100.2" })
    );

    expect(other.status).toBe("success");
  });

  it("surfaces a generic error, not a crash, when the limiter is unavailable", async () => {
    const brokenLimiter: RateLimiter = {
      async check() {
        throw new Error("Distributed rate limiter unavailable");
      },
    };

    const result = await submitLead(KEY, leadFormData(), deps({ rateLimiter: brokenLimiter }));

    expect(result).toEqual({ status: "error" });
    expect(repository.rows).toHaveLength(0);
  });
});
