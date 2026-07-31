import { afterEach, describe, expect, it, vi } from "vitest";
import { getZoomServerCredentials, resetServerEnvCache } from "../server";

const zoomEnvironment = {
  ZOOM_ACCOUNT_ID: "account-id",
  ZOOM_CLIENT_ID: "client-id",
  ZOOM_CLIENT_SECRET: "client-secret",
  ZOOM_HOST_USER_ID: "owner@example.com",
};

function configureZoom(overrides: Partial<typeof zoomEnvironment> = {}): void {
  for (const [name, value] of Object.entries({
    ...zoomEnvironment,
    ...overrides,
  })) {
    vi.stubEnv(name, value);
  }
  resetServerEnvCache();
}

describe("Zoom server environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetServerEnvCache();
  });

  it("identifies the exact missing credential without exposing its value", () => {
    configureZoom({ ZOOM_HOST_USER_ID: "" });

    expect(() => getZoomServerCredentials()).toThrow(
      "zoom_host_user_id_missing"
    );
  });

  it("identifies the exact oversized credential", () => {
    configureZoom({ ZOOM_ACCOUNT_ID: "a".repeat(201) });

    expect(() => getZoomServerCredentials()).toThrow(
      "zoom_account_id_too_long"
    );
  });
});
