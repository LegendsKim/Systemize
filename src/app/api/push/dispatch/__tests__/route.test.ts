import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvCache } from "@/lib/env/server";
import { GET } from "../route";

describe("push dispatch route", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("CRON_SECRET", "test-cron-secret-at-least-16-characters");
    resetServerEnvCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetServerEnvCache();
  });

  it("rejects an unauthenticated request before requiring database credentials", async () => {
    const response = await GET(
      new Request("https://preview.example.test/api/push/dispatch")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
