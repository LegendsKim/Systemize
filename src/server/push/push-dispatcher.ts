import "server-only";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv } from "@/lib/env/client";
import { getWebPushServerCredentials } from "@/lib/env/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  buildSafePushPayload,
  classifyPushFailure,
} from "./push-delivery-policy";

type PushSubscriptionRow =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];

export interface PushDispatchSummary {
  readonly claimed: number;
  readonly delivered: number;
  readonly retried: number;
  readonly dead: number;
  readonly configured: boolean;
}

async function sendToSubscription(
  subscription: PushSubscriptionRow,
  payload: string
): Promise<void> {
  const serverCredentials = getWebPushServerCredentials();
  const publicKey = getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!serverCredentials || !publicKey) {
    throw new Error("web_push_not_configured");
  }
  const webPush = await import("web-push");
  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    payload,
    {
      TTL: 60 * 60,
      urgency: "normal",
      timeout: 8_000,
      vapidDetails: {
        subject: serverCredentials.subject,
        publicKey,
        privateKey: serverCredentials.privateKey,
      },
    }
  );
}

export async function dispatchPushOutbox(
  limit = 20
): Promise<PushDispatchSummary> {
  const serverCredentials = getWebPushServerCredentials();
  const publicKey = getPublicEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!serverCredentials || !publicKey) {
    return { claimed: 0, delivered: 0, retried: 0, dead: 0, configured: false };
  }

  const admin = getAdminSupabaseClient();
  const { data: jobs, error: claimError } = await admin.rpc("claim_push_batch", {
    p_limit: Math.min(Math.max(limit, 1), 50),
  });
  if (claimError) {
    throw new Error(`push_claim_failed:${claimError.code ?? "unknown"}`);
  }

  let delivered = 0;
  let retried = 0;
  let dead = 0;

  for (const job of jobs) {
    const [{ data: preferences }, { data: subscriptions, error: subscriptionError }] =
      await Promise.all([
        admin
          .from("notification_preferences")
          .select("muted_categories")
          .eq("user_id", job.recipient_user_id)
          .maybeSingle(),
        admin
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", job.recipient_user_id)
          .order("last_seen_at", { ascending: false })
          .limit(20),
      ]);

    if (subscriptionError) {
      throw new Error(`push_subscription_load_failed:${subscriptionError.code ?? "unknown"}`);
    }

    if (
      preferences?.muted_categories.includes(job.kind) ||
      subscriptions.length === 0
    ) {
      await admin.rpc("settle_push_delivery", {
        p_id: job.outbox_id,
        p_outcome: "delivered",
        p_error_code: null,
      });
      delivered += 1;
      continue;
    }

    const payload = JSON.stringify(
      buildSafePushPayload({
        kind: job.kind,
        href: job.href,
        notificationId: job.notification_id,
      })
    );
    let retryDecision:
      | ReturnType<typeof classifyPushFailure>
      | null = null;
    let permanentFailure = false;

    for (const subscription of subscriptions) {
      try {
        await sendToSubscription(subscription, payload);
        await admin
          .from("push_subscriptions")
          .update({
            failure_count: 0,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);
      } catch (error: unknown) {
        const decision = classifyPushFailure(error);
        if (decision.removeSubscription) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        } else {
          await admin
            .from("push_subscriptions")
            .update({
              failure_count: Math.min(subscription.failure_count + 1, 5),
            })
            .eq("id", subscription.id);
        }
        if (decision.outcome === "retry") {
          retryDecision = decision;
        } else {
          permanentFailure = true;
        }
      }
    }

    const finalRetryDecision = retryDecision;
    const shouldRetry = finalRetryDecision !== null && job.attempts < 5;
    const outcome = shouldRetry
      ? "retry"
      : finalRetryDecision || permanentFailure
        ? "dead"
        : "delivered";
    const retrySuffix =
      shouldRetry && finalRetryDecision?.retryAfterSeconds !== null
        ? `;retry_after=${finalRetryDecision?.retryAfterSeconds ?? 0}`
        : "";
    const errorCode =
      finalRetryDecision || permanentFailure
        ? `${finalRetryDecision?.errorCode ?? "permanent_failure"}${retrySuffix}`.slice(0, 80)
        : null;

    const { error: settleError } = await admin.rpc("settle_push_delivery", {
      p_id: job.outbox_id,
      p_outcome: outcome,
      p_error_code: errorCode,
    });
    if (settleError) {
      throw new Error(`push_settle_failed:${settleError.code ?? "unknown"}`);
    }
    if (outcome === "retry") retried += 1;
    else if (outcome === "dead") dead += 1;
    else delivered += 1;
  }

  return {
    claimed: jobs.length,
    delivered,
    retried,
    dead,
    configured: true,
  };
}
