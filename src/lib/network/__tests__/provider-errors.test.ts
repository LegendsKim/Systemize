import { describe, it, expect } from 'vitest';
import { categorizeHttpError } from '../provider-errors';

describe('categorizeHttpError', () => {
  it('400 returns invalid_request', () => {
    expect(categorizeHttpError(400)).toBe('invalid_request');
  });

  it('401 returns unauthorized', () => {
    expect(categorizeHttpError(401)).toBe('unauthorized');
  });

  it('403 returns unauthorized', () => {
    expect(categorizeHttpError(403)).toBe('unauthorized');
  });

  it('408 returns timeout', () => {
    expect(categorizeHttpError(408)).toBe('timeout');
  });

  it('422 returns invalid_request', () => {
    expect(categorizeHttpError(422)).toBe('invalid_request');
  });

  it('429 returns rate_limited', () => {
    expect(categorizeHttpError(429)).toBe('rate_limited');
  });

  it('500 returns transient_failure', () => {
    expect(categorizeHttpError(500)).toBe('transient_failure');
  });

  it('502 returns transient_failure', () => {
    expect(categorizeHttpError(502)).toBe('transient_failure');
  });

  it('503 returns transient_failure', () => {
    expect(categorizeHttpError(503)).toBe('transient_failure');
  });

  it('504 returns transient_failure', () => {
    expect(categorizeHttpError(504)).toBe('transient_failure');
  });

  it('404 returns permanent_rejection', () => {
    expect(categorizeHttpError(404)).toBe('permanent_rejection');
  });

  it('410 returns permanent_rejection', () => {
    expect(categorizeHttpError(410)).toBe('permanent_rejection');
  });
});
