import { describe, expect, it } from 'vitest';

import clamp from '../../src/clamp/index.ts';

describe('clamp', () => {
  it('returns the value when it is in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('limits the value to the bounds', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('throws when min is greater than max', () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError);
  });
});
