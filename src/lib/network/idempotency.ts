export interface IdempotencyRecord {
  key: string;
  result: unknown;
  createdAt: string;
}

export interface IdempotencyStore {
  find(key: string): Promise<IdempotencyRecord | null>;
  save(key: string, result: unknown): Promise<void>;
}

export class TestIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, IdempotencyRecord>();

  async find(key: string): Promise<IdempotencyRecord | null> {
    return this.store.get(key) || null;
  }

  async save(key: string, result: unknown): Promise<void> {
    this.store.set(key, {
      key,
      result,
      createdAt: new Date().toISOString(),
    });
  }
}

// NOTE: Production uses database-backed idempotency (e.g. Supabase unique constraint on idempotency_key).
