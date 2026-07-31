import { timingSafeEqual } from "node:crypto";
import { getCronSecret } from "@/lib/env/server";
import { dispatchPushOutbox } from "@/server/push/push-dispatcher";
import { dispatchMeetingIntegrations } from "@/server/meetings/meeting-dispatcher";
import { monitorSystemHealth } from "@/server/system-health/system-health-monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  const secret = getCronSecret();
  if (!secret) {
    return Response.json({ error: "cron_not_configured" }, { status: 503, headers });
  }
  if (!authorized(request, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  try {
    const meetings = await dispatchMeetingIntegrations(10);
    const health = await monitorSystemHealth();
    const push = await dispatchPushOutbox(25);
    return Response.json(
      {
        push,
        meetings,
        health: {
          failed: health.failed.length,
          recovered: health.recovered.length,
        },
      },
      { headers }
    );
  } catch {
    return Response.json({ error: "dispatch_failed" }, { status: 500, headers });
  }
}
