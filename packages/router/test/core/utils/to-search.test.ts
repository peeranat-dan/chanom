import { describe, expect, it } from 'vitest';

import toSearch from '../../../src/core/utils/to-search.ts';

describe('toSearch', () => {
  it('serializes records, skipping empty values and repeating arrays', () => {
    expect(toSearch({ q: 'milk tea', page: 2, tag: ['a', 'b'], skip: undefined })).toBe(
      '?q=milk+tea&page=2&tag=a&tag=b',
    );
  });

  it('accepts strings with or without ?', () => {
    expect(toSearch('q=1')).toBe('?q=1');
    expect(toSearch('?q=1')).toBe('?q=1');
  });

  it('accepts URLSearchParams', () => {
    expect(toSearch(new URLSearchParams({ q: '1' }))).toBe('?q=1');
  });

  it('is empty for missing or empty input', () => {
    expect(toSearch(undefined)).toBe('');
    expect(toSearch('')).toBe('');
    expect(toSearch({})).toBe('');
  });
});
