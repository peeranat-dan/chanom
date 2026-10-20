import { describe, expect, it } from 'vitest';

import extractQueryString from '../../../src/get-query-params/utils/extract-query-string.ts';

describe('extractQueryString', () => {
  it('returns everything between ? and #', () => {
    expect(extractQueryString('https://example.com/p?a=1&b=2#hash')).toBe('a=1&b=2');
  });

  it('returns the rest of the string when there is no hash after the query', () => {
    expect(extractQueryString('?a=1')).toBe('a=1');
    expect(extractQueryString('/#/page?tab=info')).toBe('tab=info');
  });

  it('returns an empty string when there is no ?', () => {
    expect(extractQueryString('https://example.com/p#a=1')).toBe('');
  });
});
