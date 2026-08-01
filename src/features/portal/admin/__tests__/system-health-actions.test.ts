import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  monitor: vi.fn(),
  schedulePush: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/portal/auth/session", () => ({
  requireSystemizeOwner: mocks.requireOwner,
}));
vi.mock("@/server/system-health/system-health-monitor", () => ({
  monitorSystemHealth: mocks.monitor,
}));
vi.mock("@/server/push/schedule", () => ({
  schedulePushOutboxDrain: mocks.schedulePush,
}));

import { runSystemHealthCheck } from "../system-health-actions";

describe("manual system health action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
    mocks.monitor.mockResolvedValue({ checks: [], failed: [], recovered: [] });
    mocks.redirect.mockImplementation((href: string) => {
      throw new Error(`redirect:${href}`);
    });
  });

  it("reauthorizes, records the check, and schedules transition delivery", async () => {
    await expect(runSystemHealthCheck()).rejects.toThrow(
      "redirect:/admin/settings?notice=system-health-checked"
    );
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(mocks.monitor).toHaveBeenCalledTimes(1);
    expect(mocks.schedulePush).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("does not probe providers when authorization fails", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("forbidden"));
    await expect(runSystemHealthCheck()).rejects.toThrow("forbidden");
    expect(mocks.monitor).not.toHaveBeenCalled();
  });
});
