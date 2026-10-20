import { describe, expect, it } from 'vitest';

import chunk from '../../src/chunk/index.ts';

describe('chunk', () => {
  it('splits into equal chunks with the remainder last', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size exceeds the length', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('returns no chunks for an empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('throws on a size that is not a positive integer', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], 1.5)).toThrow(RangeError);
  });
});
