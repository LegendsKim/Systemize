import "server-only";
import { after } from "next/server";
import { dispatchMeetingIntegrations } from "./meeting-dispatcher";

export function scheduleMeetingIntegrationDrain(): void {
  after(async () => {
    try {
      await dispatchMeetingIntegrations(5);
    } catch {
      console.warn("meeting_dispatch_deferred reason=immediate_dispatch_failed");
    }
  });
}
