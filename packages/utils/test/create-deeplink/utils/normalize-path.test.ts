import { describe, expect, it } from 'vitest';

import normalizePath from '../../../src/create-deeplink/utils/normalize-path.ts';

describe('normalizePath', () => {
  it('drops leading, trailing, and duplicate slashes', () => {
    expect(normalizePath('//product//42/')).toBe('product/42');
  });

  it('percent-encodes each segment', () => {
    expect(normalizePath('search/tea & milk?')).toBe('search/tea%20%26%20milk%3F');
  });

  it('returns an empty string for an empty path', () => {
    expect(normalizePath('')).toBe('');
    expect(normalizePath('/')).toBe('');
  });
});
