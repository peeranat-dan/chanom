import { describe, expect, it } from 'vitest';

import appendSearchValue from '../../../src/core/utils/append-search-value.ts';

describe('appendSearchValue', () => {
  it('stringifies scalars', () => {
    const params = new URLSearchParams();
    appendSearchValue(params, 'page', 2);
    appendSearchValue(params, 'draft', false);

    expect(params.toString()).toBe('page=2&draft=false');
  });

  it('repeats the key for arrays and skips empty values', () => {
    const params = new URLSearchParams();
    appendSearchValue(params, 'tag', ['a', null, 'b', undefined]);
    appendSearchValue(params, 'q', null);

    expect(params.toString()).toBe('tag=a&tag=b');
  });
});
