import { describe, it, expect } from 'vitest';
import { redactSensitiveFields } from '../redact';

describe('redactSensitiveFields', () => {
  it('password field is redacted to [REDACTED]', () => {
    expect(redactSensitiveFields({ password: 'secret123' })).toEqual({ password: '[REDACTED]' });
  });

  it('token field is redacted', () => {
    expect(redactSensitiveFields({ token: 'abcxyz' })).toEqual({ token: '[REDACTED]' });
  });

  it('apiKey field is redacted (case-insensitive)', () => {
    expect(redactSensitiveFields({ apiKey: 'key1' })).toEqual({ apiKey: '[REDACTED]' });
    expect(redactSensitiveFields({ APIKEY: 'key2' })).toEqual({ APIKEY: '[REDACTED]' });
  });

  it('nested objects have sensitive fields redacted', () => {
    expect(redactSensitiveFields({ user: { password: '123' } })).toEqual({ user: { password: '[REDACTED]' } });
  });

  it('arrays with objects have sensitive fields redacted', () => {
    expect(redactSensitiveFields([{ apiKey: '123' }, { name: 'john' }])).toEqual([
      { apiKey: '[REDACTED]' },
      { name: 'john' }
    ]);
  });

  it('non-sensitive fields are preserved unchanged', () => {
    expect(redactSensitiveFields({ name: 'john', id: 1 })).toEqual({ name: 'john', id: 1 });
  });

  it('null and undefined inputs are handled', () => {
    expect(redactSensitiveFields(null)).toBeNull();
    expect(redactSensitiveFields(undefined)).toBeUndefined();
  });

  it('empty objects return empty objects', () => {
    expect(redactSensitiveFields({})).toEqual({});
  });
});
