import { describe, expect, it } from 'vitest';

import pick from '../../src/pick/index.ts';

describe('pick', () => {
  it('copies only the requested keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toStrictEqual({ a: 1, c: 3 });
  });

  it('skips keys missing from the source but keeps undefined values', () => {
    const source: { a?: number; b: number | undefined } = { b: undefined };

    expect(pick(source, ['a', 'b'])).toStrictEqual({ b: undefined });
  });

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 };
    pick(source, ['a']);

    expect(source).toStrictEqual({ a: 1, b: 2 });
  });
});
