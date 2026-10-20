import { describe, expect, it } from 'vitest';

import buildQueryString from '../../../src/create-deeplink/utils/build-query-string.ts';

describe('buildQueryString', () => {
  it('stringifies scalar values and encodes them', () => {
    expect(buildQueryString({ id: 42, ok: false, q: 'a b' })).toBe('id=42&ok=false&q=a+b');
  });

  it('repeats the key for array values', () => {
    expect(buildQueryString({ tag: ['a', 'b'] })).toBe('tag=a&tag=b');
  });

  it('skips undefined values', () => {
    expect(buildQueryString({ a: undefined, b: '1' })).toBe('b=1');
    expect(buildQueryString({})).toBe('');
  });
});
