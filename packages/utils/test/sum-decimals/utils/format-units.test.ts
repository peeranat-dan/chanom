import { describe, expect, it } from 'vitest';

import formatUnits from '../../../src/sum-decimals/utils/format-units.ts';

describe('formatUnits', () => {
  it('places the decimal point by scale', () => {
    expect(formatUnits(12345n, 2)).toBe('123.45');
  });

  it('pads with leading zeros when the value is below one', () => {
    expect(formatUnits(5n, 3)).toBe('0.005');
    expect(formatUnits(-5n, 2)).toBe('-0.05');
  });

  it('omits the decimal point at scale 0', () => {
    expect(formatUnits(-42n, 0)).toBe('-42');
    expect(formatUnits(0n, 0)).toBe('0');
  });
});
