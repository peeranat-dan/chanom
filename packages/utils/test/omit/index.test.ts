import { describe, expect, it } from 'vitest';

import omit from '../../src/omit/index.ts';

describe('omit', () => {
  it('copies everything except the given keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toStrictEqual({ a: 1, c: 3 });
  });

  it('keeps symbol keys that are not omitted and drops those that are', () => {
    const kept = Symbol('kept');
    const dropped = Symbol('dropped');
    const result = omit({ a: 1, [kept]: 2, [dropped]: 3 }, ['a', dropped]);

    expect(Reflect.ownKeys(result)).toEqual([kept]);
    expect(result[kept]).toBe(2);
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
