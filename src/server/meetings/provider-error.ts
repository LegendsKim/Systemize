import "server-only";

export type MeetingProviderErrorCategory =
  | "configuration"
  | "invalid_request"
  | "rate_limited"
  | "timeout"
  | "network"
  | "transient"
  | "permanent";

export class MeetingProviderError extends Error {
  constructor(
    readonly category: MeetingProviderErrorCategory,
    readonly safeCode: string,
    readonly retryAfterSeconds: number | null = null
  ) {
    super(safeCode);
    this.name = "MeetingProviderError";
  }
}

export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(Math.ceil(seconds), 3600);
  }
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(Math.ceil((date - Date.now()) / 1000), 0), 3600);
}

export function classifyProviderStatus(
  provider: "zoom" | "google",
  response: Response
): MeetingProviderError {
  const code = `${provider}_http_${response.status}`;
  if (response.status === 429) {
    return new MeetingProviderError(
      "rate_limited",
      code,
      parseRetryAfter(response.headers.get("retry-after"))
    );
  }
  if (response.status >= 500 || response.status === 408) {
    return new MeetingProviderError("transient", code);
  }
  if (response.status === 401 || response.status === 403) {
    return new MeetingProviderError("configuration", code);
  }
  if (response.status >= 400 && response.status < 500) {
    return new MeetingProviderError("invalid_request", code);
  }
  return new MeetingProviderError("permanent", code);
}

export async function providerFetch(
  provider: "zoom" | "google",
  input: string,
  init: RequestInit,
  timeoutMs = 8_000
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new MeetingProviderError("timeout", `${provider}_timeout`);
    }
    throw new MeetingProviderError("network", `${provider}_network`);
  }
}

export function shouldRetryProviderError(error: unknown): boolean {
  return (
    error instanceof MeetingProviderError &&
    ["rate_limited", "timeout", "network", "transient"].includes(
      error.category
    )
  );
}
