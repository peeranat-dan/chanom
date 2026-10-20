import { describe, expect, it } from 'vitest';

import getBackoffDelay from '../../../src/retry/utils/get-backoff-delay.ts';

describe('getBackoffDelay', () => {
  const options = { delay: 100, factor: 2, maxDelay: 1000 };

  it('grows the delay by factor per attempt', () => {
    expect([0, 1, 2, 3].map((attempt) => getBackoffDelay(attempt, options))).toEqual([
      100, 200, 400, 800,
    ]);
  });

  it('caps the delay at maxDelay', () => {
    expect(getBackoffDelay(4, options)).toBe(1000);
  });

  it('keeps a constant delay with factor 1', () => {
    expect(getBackoffDelay(5, { ...options, factor: 1 })).toBe(100);
  });
});
