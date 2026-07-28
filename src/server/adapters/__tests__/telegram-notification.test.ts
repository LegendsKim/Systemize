import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Notification } from "../notification";
import {
  TelegramNotificationProvider,
  type TelegramProviderConfig,
} from "../telegram-notification";

/**
 * The Telegram adapter's network contract (QUALITY.md §7): explicit timeout, retries
 * on network failure / 429 / transient 5xx only, never on an ordinary 4xx,
 * `Retry-After` honoured, and a bounded retry cap.
 *
 * No credential is real and no request leaves the process, `fetch` is stubbed. The
 * build and the suite never need a bot token.
 */

const notification: Notification = {
  type: "lead_received",
  subject: "ליד חדש מהאתר",
  body: "שם: דנה לוי\nטלפון: 050-1234567",
  metadata: { leadId: "lead-1", requestId: "req-1" },
};

const CONFIG: Required<TelegramProviderConfig> = {
  botToken: "test-bot-token",
  chatId: "-1000000000",
  apiBaseUrl: "https://telegram.invalid",
  timeoutMs: 50,
  maxRetries: 2,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

/** A request that only ever settles when its signal aborts. */
function neverResolving(init?: { signal?: AbortSignal | null }): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(abortError()));
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  // Removes jitter from the assertions without removing it from the implementation.
  vi.spyOn(Math, "random").mockReturnValue(0);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function provider(overrides: Partial<typeof CONFIG> = {}) {
  return new TelegramNotificationProvider({ ...CONFIG, ...overrides });
}

/** Drains the retry sleeps without waiting in real time. */
async function settle<T>(promise: Promise<T>, ms = 30_000): Promise<T> {
  await vi.advanceTimersByTimeAsync(ms);
  return promise;
}

describe("TelegramNotificationProvider, success", () => {
  it("posts to sendMessage and reports the provider message id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 42 } }));

    const result = await settle(provider().send(notification));

    expect(result).toEqual({ success: true, providerId: "telegram:42" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://telegram.invalid/bottest-bot-token/sendMessage");
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.chat_id).toBe(CONFIG.chatId);
    expect(String(body.text)).toContain(notification.subject);
    expect(String(body.text)).toContain("050-1234567");
    // No parse_mode: visitor text can then never be interpreted as markup.
    expect(body).not.toHaveProperty("parse_mode");
    // The token belongs in the URL only.
    expect(String(init.body)).not.toContain(CONFIG.botToken);
  });

  it("sends the request with an abort signal, so the call always has a timeout", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 1 } }));

    await settle(provider().send(notification));

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("TelegramNotificationProvider, 4xx is never retried", () => {
  it.each([
    [400, "invalid_request"],
    [401, "unauthorized"],
    [403, "unauthorized"],
    [404, "permanent_rejection"],
  ])("status %i fails immediately as %s", async (status, category) => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, description: "no" }, status));

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(false);
    expect(result.error?.category).toBe(category);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a 200 with ok:false as a permanent rejection, not a retry", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, description: "chat not found" }));

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(false);
    expect(result.error?.category).toBe("permanent_rejection");
    expect(result.error?.message).toBe("chat not found");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an unrecognised payload rather than reporting success", async () => {
    fetchMock.mockResolvedValue(
      new Response("not json at all", { headers: { "content-type": "text/plain" } })
    );

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(false);
    expect(result.error?.category).toBe("permanent_rejection");
  });
});

describe("TelegramNotificationProvider, retries", () => {
  it("honours Retry-After before trying again", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ ok: false }, 429, { "retry-after": "3" })
      )
      .mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 7 } }));

    const pending = provider().send(notification);

    await vi.advanceTimersByTimeAsync(1_500);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await expect(settle(pending)).resolves.toEqual({
      success: true,
      providerId: "telegram:7",
    });
  });

  it("backs off exponentially on a transient 5xx and then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: false }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: false }, 502))
      .mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 9 } }));

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops at the retry cap and reports a transient failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false }, 503));

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(false);
    expect(result.error?.category).toBe("transient_failure");
    // First attempt plus maxRetries, and not one more.
    expect(fetchMock).toHaveBeenCalledTimes(1 + CONFIG.maxRetries);
  });

  it("retries a network failure", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 3 } }));

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("times out an unresponsive request and reports a timeout after the cap", async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      neverResolving({ signal: init.signal })
    );

    const result = await settle(provider().send(notification));

    expect(result.success).toBe(false);
    expect(result.error?.category).toBe("timeout");
    expect(fetchMock).toHaveBeenCalledTimes(1 + CONFIG.maxRetries);
  });
});

describe("TelegramNotificationProvider, caller deadline", () => {
  it("gives up immediately when the caller's signal aborts, without retrying", async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      neverResolving({ signal: init.signal })
    );

    const controller = new AbortController();
    const pending = provider({ timeoutMs: 10_000 }).send(notification, {
      signal: controller.signal,
    });

    controller.abort();
    const result = await settle(pending);

    expect(result.success).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
