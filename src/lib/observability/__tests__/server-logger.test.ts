import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServerLogger } from "../server-logger";

/**
 * The production-path logger. Its reason to exist is that it does not fall silent in
 * production, so that is what is asserted.
 */

const originalNodeEnv = process.env.NODE_ENV;

let log: ReturnType<typeof vi.spyOn>;
let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

function setNodeEnv(value: string): void {
  // NODE_ENV is readonly in the Next.js types; the test needs to vary it.
  (process.env as Record<string, string>).NODE_ENV = value;
}

beforeEach(() => {
  log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  error = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  setNodeEnv(originalNodeEnv ?? "test");
});

describe("createServerLogger", () => {
  it("still emits info, warn and error in production", () => {
    setNodeEnv("production");
    const logger = createServerLogger();

    logger.info("stored", { requestId: "req-1" });
    logger.warn("limited", { requestId: "req-1" });
    logger.error("notification failed", { requestId: "req-1" });

    expect(log).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("suppresses debug in production but not elsewhere", () => {
    setNodeEnv("production");
    createServerLogger().debug("noisy");
    expect(log).not.toHaveBeenCalled();

    setNodeEnv("development");
    createServerLogger().debug("noisy");
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("writes one structured JSON line with the level and message", () => {
    createServerLogger().error("notification failed", {
      requestId: "req-1",
      category: "notification",
    });

    const line = String(error.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("notification failed");
    expect(parsed.context).toMatchObject({
      requestId: "req-1",
      category: "notification",
    });
  });

  it("redacts sensitive field names", () => {
    createServerLogger().error("boom", { botToken: "super-secret" });
    expect(String(error.mock.calls[0]?.[0])).not.toContain("super-secret");
  });

  it("captures an exception without its message, which can quote a row", () => {
    createServerLogger().captureException(new TypeError("value dana@example.co.il"), {
      requestId: "req-1",
    });

    const line = String(error.mock.calls[0]?.[0]);
    expect(line).toContain("TypeError");
    expect(line).not.toContain("dana@example.co.il");
  });
});
