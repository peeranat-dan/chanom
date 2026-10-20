import { describe, expect, it } from 'vitest';

import omit from '../../src/omit/index.ts';

describe('omit', () => {
  it('copies everything except the given keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toStrictEqual({ a: 1, c: 3 });
  });

  it('returns a shallow copy when no keys are given', () => {
    const source = { a: 1 };
    const result = omit(source, []);

    expect(result).toStrictEqual({ a: 1 });
    expect(result).not.toBe(source);
  });

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 };
    omit(source, ['a']);

    expect(source).toStrictEqual({ a: 1, b: 2 });
  });
});
