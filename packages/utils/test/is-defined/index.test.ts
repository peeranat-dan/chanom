import { describe, expect, it } from 'vitest';

import isDefined from '../../src/is-defined/index.ts';

describe('isDefined', () => {
  it('is false only for null and undefined', () => {
    expect([0, '', false, Number.NaN, null, undefined].map(isDefined)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('narrows the element type when filtering', () => {
    const values: (number | undefined)[] = [1, undefined, 2];
    const defined: number[] = values.filter(isDefined);

    expect(defined).toEqual([1, 2]);
  });
});
