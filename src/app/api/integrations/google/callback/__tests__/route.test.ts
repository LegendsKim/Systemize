import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieDelete: vi.fn(),
  getPortalIdentity: vi.fn(),
  exchangeCode: vi.fn(),
  getAuthorizedEmail: vi.fn(),
  rpc: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    delete: mocks.cookieDelete,
  })),
}));

vi.mock("@/features/portal/auth/session", () => ({
  getPortalIdentity: mocks.getPortalIdentity,
}));

vi.mock("@/lib/env/server", () => ({
  getSystemizeOwnerGmail: () => "owner@gmail.com",
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminSupabaseClient: () => ({ rpc: mocks.rpc }),
}));

vi.mock("@/server/meetings/google-oauth", () => ({
  exchangeGoogleCalendarCode: mocks.exchangeCode,
  getAuthorizedGoogleEmail: mocks.getAuthorizedEmail,
}));

vi.mock("@/server/meetings/schedule", () => ({
  scheduleMeetingIntegrationDrain: mocks.schedule,
}));

import { GET } from "../route";

describe("Google Calendar OAuth callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPortalIdentity.mockResolvedValue({
      userId: "owner-id",
      email: "owner@gmail.com",
      fullName: "Owner",
      appRole: "systemize_owner",
      onboardedAt: "2026-01-01T00:00:00Z",
    });
    mocks.cookieGet.mockReturnValue({ value: "expected-state" });
    mocks.exchangeCode.mockResolvedValue({
      refreshToken: "r".repeat(80),
      accessToken: "a".repeat(40),
      scopes: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/calendar.events.owned",
      ],
    });
    mocks.getAuthorizedEmail.mockResolvedValue("owner@gmail.com");
    mocks.rpc.mockResolvedValue({ error: null });
  });

  it("rejects a mismatched state before exchanging a provider code", async () => {
    const response = await GET(
      new Request(
        "https://www.systemize.co.il/api/integrations/google/callback?code=test-code&state=wrong-state"
      )
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(
      "notice=google-calendar-state-invalid"
    );
    expect(mocks.exchangeCode).not.toHaveBeenCalled();
    expect(mocks.cookieDelete).toHaveBeenCalled();
  });

  it("refuses a calendar owned by a different Google account", async () => {
    mocks.getAuthorizedEmail.mockResolvedValue("someone-else@gmail.com");

    const response = await GET(
      new Request(
        "https://www.systemize.co.il/api/integrations/google/callback?code=test-code&state=expected-state"
      )
    );

    expect(response.headers.get("location")).toContain(
      "notice=google-calendar-account-mismatch"
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("stores the offline credential and starts pending meeting work", async () => {
    const response = await GET(
      new Request(
        "https://www.systemize.co.il/api/integrations/google/callback?code=test-code&state=expected-state"
      )
    );

    expect(response.headers.get("location")).toContain(
      "notice=google-calendar-connected"
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "store_google_calendar_connection",
      expect.objectContaining({
        p_connected_by: "owner-id",
        p_connected_email: "owner@gmail.com",
      })
    );
    expect(mocks.schedule).toHaveBeenCalledTimes(1);
  });
});
