import { describe, it, expect } from 'vitest';
import { contactRequestSchema } from '../schemas';

describe('contactRequestSchema', () => {
  it('valid input passes', () => {
    const res = contactRequestSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, this is a test message.'
    });
    expect(res.success).toBe(true);
  });

  it('missing name fails', () => {
    const res = contactRequestSchema.safeParse({
      email: 'john@example.com',
      message: 'Hello, this is a test message.'
    });
    expect(res.success).toBe(false);
  });

  it('invalid email fails', () => {
    const res = contactRequestSchema.safeParse({
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Hello, this is a test message.'
    });
    expect(res.success).toBe(false);
  });

  it('message too short fails', () => {
    const res = contactRequestSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'short'
    });
    expect(res.success).toBe(false);
  });

  it('message too long fails (>5000 chars)', () => {
    const res = contactRequestSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'a'.repeat(5001)
    });
    expect(res.success).toBe(false);
  });

  it('email is lowercased', () => {
    const res = contactRequestSchema.parse({
      name: 'John Doe',
      email: 'JOHN@EXAMPLE.COM',
      message: 'Hello, this is a test message.'
    });
    expect(res.email).toBe('john@example.com');
  });

  it('name is trimmed', () => {
    const res = contactRequestSchema.parse({
      name: '   John Doe   ',
      email: 'john@example.com',
      message: 'Hello, this is a test message.'
    });
    expect(res.name).toBe('John Doe');
  });
});
