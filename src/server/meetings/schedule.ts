import "server-only";
import { after } from "next/server";
import { dispatchPushOutbox } from "@/server/push/push-dispatcher";
import { monitorSystemHealth } from "@/server/system-health/system-health-monitor";
import { dispatchMeetingIntegrations } from "./meeting-dispatcher";

export function scheduleMeetingIntegrationDrain(): void {
  after(async () => {
    try {
      await dispatchMeetingIntegrations(5);
      await monitorSystemHealth();
      await dispatchPushOutbox(10);
    } catch {
      console.warn("meeting_dispatch_deferred reason=immediate_dispatch_failed");
    }
  });
}
