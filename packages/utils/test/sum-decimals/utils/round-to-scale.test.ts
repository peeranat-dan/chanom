import { describe, expect, it } from 'vitest';

import roundToScale from '../../../src/sum-decimals/utils/round-to-scale.ts';

describe('roundToScale', () => {
  it('scales up exactly', () => {
    expect(roundToScale(15n, 1, 3)).toBe(1500n);
  });

  it('returns the units unchanged at the same scale', () => {
    expect(roundToScale(-15n, 2, 2)).toBe(-15n);
  });

  it('rounds half away from zero when scaling down', () => {
    expect(roundToScale(125n, 3, 2)).toBe(13n);
    expect(roundToScale(-125n, 3, 2)).toBe(-13n);
  });

  it('rounds below half toward zero', () => {
    expect(roundToScale(1249n, 4, 2)).toBe(12n);
    expect(roundToScale(-1249n, 4, 2)).toBe(-12n);
  });
});
