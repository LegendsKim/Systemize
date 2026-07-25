export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  remaining?: number;
}

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private counts = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    let record = this.counts.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
    }

    record.count++;
    this.counts.set(key, record);

    if (record.count > limit) {
      return {
        allowed: false,
        retryAfterMs: Math.max(0, record.resetAt - now),
        remaining: 0,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - record.count),
    };
  }
}
