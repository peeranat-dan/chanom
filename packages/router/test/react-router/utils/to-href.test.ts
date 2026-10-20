import { describe, expect, it } from 'vitest';

import type {} from '../../support/register.ts';

import toHref from '../../../src/react-router/utils/to-href.ts';

describe('toHref', () => {
  it('builds the href from loose options', () => {
    expect(toHref('/posts/:id', { params: { id: '1' }, search: 'a=1', hash: 'h' })).toBe(
      '/posts/1?a=1#h',
    );
  });

  it('works without options', () => {
    expect(toHref('/about')).toBe('/about');
  });
});
