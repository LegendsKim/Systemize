import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  dispatch: vi.fn(),
  requeue: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  monitor: vi.fn(),
  schedulePush: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/portal/auth/session", () => ({
  requireSystemizeOwner: mocks.requireOwner,
}));
vi.mock("@/server/meetings/meeting-dispatcher", () => ({
  dispatchMeetingIntegrations: mocks.dispatch,
}));
vi.mock("@/server/system-health/system-health-monitor", () => ({
  monitorSystemHealth: mocks.monitor,
}));
vi.mock("@/server/push/schedule", () => ({
  schedulePushOutboxDrain: mocks.schedulePush,
}));
vi.mock("@/server/repositories/meeting-integration.repository", () => ({
  requeueUnfinishedMeetingIntegrations: mocks.requeue,
}));

import { retryMeetingIntegrations } from "../meeting-integration-actions";

describe("meeting integration retry action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
    mocks.requeue.mockResolvedValue(1);
    mocks.monitor.mockResolvedValue({ checks: [], failed: [], recovered: [] });
    mocks.redirect.mockImplementation((href: string) => {
      throw new Error(`redirect:${href}`);
    });
  });

  it("reauthorizes the owner and reports a delivered Zoom and Calendar job", async () => {
    mocks.dispatch.mockResolvedValue({
      claimed: 1,
      delivered: 1,
      retried: 0,
      attention: 0,
      configured: true,
      calendarConnected: true,
    });

    await expect(retryMeetingIntegrations()).rejects.toThrow(
      "redirect:/admin/settings?notice=meeting-integrations-ready"
    );
    expect(mocks.requireOwner).toHaveBeenCalledTimes(1);
    expect(mocks.requeue).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch).toHaveBeenCalledWith(5);
    expect(mocks.monitor).toHaveBeenCalledTimes(1);
    expect(mocks.schedulePush).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/settings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/portal");
  });

  it("does not contact providers when owner authorization fails", async () => {
    mocks.requireOwner.mockRejectedValue(new Error("forbidden"));

    await expect(retryMeetingIntegrations()).rejects.toThrow("forbidden");
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(mocks.requeue).not.toHaveBeenCalled();
  });
});
