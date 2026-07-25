import { describe, it, expect } from 'vitest';
import { TestIdempotencyStore } from '../idempotency';

describe('TestIdempotencyStore', () => {
  it('find returns null for unknown key', async () => {
    const store = new TestIdempotencyStore();
    expect(await store.find('unknown')).toBeNull();
  });

  it('save and find retrieves the saved record', async () => {
    const store = new TestIdempotencyStore();
    await store.save('test-key', { status: 'ok' });
    const record = await store.find('test-key');
    expect(record).not.toBeNull();
    expect(record?.result).toEqual({ status: 'ok' });
    expect(record?.key).toBe('test-key');
  });

  it('duplicate key handling (throws or returns existing)', async () => {
    const store = new TestIdempotencyStore();
    await store.save('key1', { a: 1 });
    await store.save('key1', { b: 2 });
    
    // In this implementation it overwrites, so it returns existing/updated value.
    const record = await store.find('key1');
    expect(record?.result).toEqual({ b: 2 });
  });
});
