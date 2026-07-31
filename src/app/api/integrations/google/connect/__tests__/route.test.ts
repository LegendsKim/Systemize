import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  getPortalIdentity: vi.fn(),
  buildAuthorizationUrl: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mocks.cookieSet })),
}));

vi.mock("@/features/portal/auth/session", () => ({
  getPortalIdentity: mocks.getPortalIdentity,
}));

vi.mock("@/server/meetings/google-oauth", () => ({
  buildGoogleCalendarAuthorizationUrl: mocks.buildAuthorizationUrl,
}));

import { GET } from "../route";

describe("Google Calendar OAuth connection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPortalIdentity.mockResolvedValue({
      userId: "owner-id",
      email: "owner@gmail.com",
      appRole: "systemize_owner",
    });
    mocks.buildAuthorizationUrl.mockReturnValue(
      "https://accounts.google.com/o/oauth2/v2/auth?state=test"
    );
  });

  it("keeps the CSRF state long enough to read Google's consent screens", async () => {
    const response = await GET();

    expect(response.status).toBe(303);
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "systemize_google_calendar_state",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/integrations/google/callback",
        maxAge: 30 * 60,
      })
    );
  });

  it("does not start provider authorization for a client account", async () => {
    mocks.getPortalIdentity.mockResolvedValue({
      userId: "client-id",
      email: "client@gmail.com",
      appRole: "client",
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mocks.buildAuthorizationUrl).not.toHaveBeenCalled();
  });
});
