import { describe, it, expect } from 'vitest';
import { InMemoryRateLimiter } from '../rate-limit';

describe('InMemoryRateLimiter', () => {
  it('first request within limit is allowed', async () => {
    const limiter = new InMemoryRateLimiter();
    const res = await limiter.check('ip', 1, 1000);
    expect(res.allowed).toBe(true);
  });

  it('requests exceeding limit are denied', async () => {
    const limiter = new InMemoryRateLimiter();
    await limiter.check('ip', 1, 1000);
    const res = await limiter.check('ip', 1, 1000);
    expect(res.allowed).toBe(false);
  });

});
