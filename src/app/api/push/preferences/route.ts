import { notificationPreferencesSchema } from "@/features/portal/pwa/push-schema";
import { getPortalIdentity } from "@/features/portal/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hasTrustedMutationOrigin,
  readBoundedJson,
} from "@/lib/network/request-boundary";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store, max-age=0" };
  if (!hasTrustedMutationOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403, headers });
  }
  const identity = await getPortalIdentity();
  if (!identity) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const parsed = notificationPreferencesSchema.safeParse(
    await readBoundedJson(request)
  );
  if (!parsed.success) {
    return Response.json({ error: "invalid_preferences" }, { status: 400, headers });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: identity.userId,
      muted_categories: parsed.data.mutedCategories,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return error
    ? Response.json({ error: "save_failed" }, { status: 500, headers })
    : Response.json({ ok: true }, { headers });
}
