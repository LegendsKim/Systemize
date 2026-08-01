import { NextResponse } from "next/server";
import {
  pushSubscriptionDeleteSchema,
  pushSubscriptionSchema,
} from "@/features/portal/pwa/push-schema";
import { getPortalIdentity } from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasTrustedMutationOrigin,
  readBoundedJson,
} from "@/lib/network/request-boundary";

export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
} as const;

export async function POST(request: Request): Promise<Response> {
  if (!hasTrustedMutationOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403, headers: privateHeaders });
  }
  const identity = await getPortalIdentity();
  if (!identity) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const parsed = pushSubscriptionSchema.safeParse(await readBoundedJson(request));
  if (!parsed.success) {
    return Response.json({ error: "invalid_subscription" }, { status: 400, headers: privateHeaders });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: identity.userId,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        user_agent: parsed.data.userAgent,
        last_seen_at: new Date().toISOString(),
        failure_count: 0,
      },
      { onConflict: "endpoint" }
    )
    .select("id")
    .single();

  if (error || !data) {
    return Response.json(
      { error: error?.code === "23505" ? "device_belongs_to_other_account" : "save_failed" },
      { status: error?.code === "23505" ? 409 : 500, headers: privateHeaders }
    );
  }

  return NextResponse.json({ id: data.id }, { headers: privateHeaders });
}

export async function DELETE(request: Request): Promise<Response> {
  if (!hasTrustedMutationOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403, headers: privateHeaders });
  }
  const identity = await getPortalIdentity();
  if (!identity) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const parsed = pushSubscriptionDeleteSchema.safeParse(
    await readBoundedJson(request)
  );
  if (!parsed.success) {
    return Response.json({ error: "invalid_subscription" }, { status: 400, headers: privateHeaders });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("id", parsed.data.subscriptionId)
    .eq("user_id", identity.userId);

  return error
    ? Response.json({ error: "delete_failed" }, { status: 500, headers: privateHeaders })
    : Response.json({ ok: true }, { headers: privateHeaders });
}
