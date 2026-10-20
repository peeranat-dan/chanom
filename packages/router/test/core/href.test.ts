import { describe, expect, it } from 'vitest';

import type {} from '../support/register.ts';

import href from '../../src/core/href.ts';

describe('href', () => {
  it('returns static paths unchanged', () => {
    expect(href('/about')).toBe('/about');
    expect(href('/')).toBe('/');
  });

  it('combines the pathname, search, and hash', () => {
    expect(href('/posts/:id', { params: { id: '1' }, search: { tab: 'a' }, hash: 'top' })).toBe(
      '/posts/1?tab=a#top',
    );
  });

  it('type-checks paths and params', () => {
    // @ts-expect-error unknown path
    expect(href('/missing')).toBe('/missing');
    // @ts-expect-error the type rejects a missing param; the runtime guard covers untyped callers.
    expect(() => href('/posts/:id', { params: {} })).toThrow('Missing param "id"');
  });
});
