import "server-only";
import { after } from "next/server";
import { dispatchPushOutbox } from "./push-dispatcher";

export function schedulePushOutboxDrain(): void {
  after(async () => {
    try {
      await dispatchPushOutbox(10);
    } catch {
      // The durable outbox is intentionally left for the scheduled recovery scan.
      console.warn("push_dispatch_deferred reason=immediate_dispatch_failed");
    }
  });
}
