import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { RateLimiter, RateLimitResult } from "./rate-limit";

export class SupabaseRateLimiter implements RateLimiter {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async check(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const { data, error } = await this.supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });

    if (error || !data?.[0]) {
      throw new Error("Distributed rate limiter unavailable");
    }

    const result = data[0];
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      ...(result.retry_after_ms > 0
        ? { retryAfterMs: result.retry_after_ms }
        : {}),
    };
  }
}
