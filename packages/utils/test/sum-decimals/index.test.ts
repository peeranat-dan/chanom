import { describe, expect, it } from 'vitest';

import sumDecimals from '../../src/sum-decimals/index.ts';

describe('sumDecimals', () => {
  it('adds without floating point drift', () => {
    expect(sumDecimals([0.1, 0.2])).toBe(0.3);
    expect(sumDecimals([1.005, 2.01, 0.0001])).toBe(3.0151);
  });

  it('accepts numeric strings alongside numbers', () => {
    expect(sumDecimals(['19.99', 0.01, '-5'])).toBe(15);
  });

  it('returns 0 for an empty list', () => {
    expect(sumDecimals([])).toBe(0);
  });

  it('rounds the exact total half away from zero to the given precision', () => {
    expect(sumDecimals([1.005, 0], 2)).toBe(1.01);
    expect(sumDecimals([-1.005], 2)).toBe(-1.01);
    expect(sumDecimals([0.1, 0.2, 0.004], 2)).toBe(0.3);
    expect(sumDecimals([2.5], 0)).toBe(3);
  });

  it('handles exponent notation', () => {
    expect(sumDecimals([1e-7, 2e-7])).toBe(3e-7);
  });

  it('rejects an invalid precision', () => {
    expect(() => sumDecimals([1], -1)).toThrow(RangeError);
    expect(() => sumDecimals([1], 1.5)).toThrow(RangeError);
  });

  it('rejects values that are not decimals', () => {
    expect(() => sumDecimals([1, 'abc'])).toThrow(RangeError);
    expect(() => sumDecimals([Number.NaN])).toThrow(RangeError);
  });
});
