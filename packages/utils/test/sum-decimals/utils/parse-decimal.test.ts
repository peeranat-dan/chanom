import { describe, expect, it } from 'vitest';

import parseDecimal from '../../../src/sum-decimals/utils/parse-decimal.ts';

describe('parseDecimal', () => {
  it('scales plain decimals to whole units', () => {
    expect(parseDecimal(0.1)).toStrictEqual({ units: 1n, scale: 1 });
    expect(parseDecimal('-12.340')).toStrictEqual({ units: -12340n, scale: 3 });
    expect(parseDecimal(42)).toStrictEqual({ units: 42n, scale: 0 });
  });

  it('accepts a missing integer or fraction part and surrounding whitespace', () => {
    expect(parseDecimal('.25')).toStrictEqual({ units: 25n, scale: 2 });
    expect(parseDecimal(' 3. ')).toStrictEqual({ units: 3n, scale: 0 });
    expect(parseDecimal('+7')).toStrictEqual({ units: 7n, scale: 0 });
  });

  it('applies exponents in both directions', () => {
    expect(parseDecimal(1e-7)).toStrictEqual({ units: 1n, scale: 7 });
    expect(parseDecimal('2.5E3')).toStrictEqual({ units: 2500n, scale: 0 });
    expect(parseDecimal(1e21)).toStrictEqual({ units: 10n ** 21n, scale: 0 });
  });

  it('throws on non-numeric input', () => {
    for (const value of ['', '.', '-', '1.2.3', 'abc', Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => parseDecimal(value)).toThrow(RangeError);
    }
  });
});
