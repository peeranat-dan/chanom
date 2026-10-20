import { describe, expect, it } from 'vitest';

import { href } from '../src/href.ts';

describe('href', () => {
  it('returns static paths unchanged', () => {
    expect(href('/about')).toBe('/about');
    expect(href('/')).toBe('/');
  });

  it('fills and encodes params', () => {
    expect(href('/posts/:id', { params: { id: 'a b/c' } })).toBe('/posts/a%20b%2Fc');
  });

  it('drops optional params without a value', () => {
    expect(href('/:lang?/docs', { params: {} })).toBe('/docs');
    expect(href('/:lang?/docs', { params: { lang: 'th' } })).toBe('/th/docs');
  });

  it('keeps slashes in splat values', () => {
    expect(href('/files/*', { params: { '*': 'a b/c' } })).toBe('/files/a%20b/c');
  });

  it('throws when a required param is missing', () => {
    // @ts-expect-error the type already rejects this; the runtime guard covers untyped callers.
    expect(() => href('/posts/:id', { params: {} })).toThrow(
      'Missing param "id" for path "/posts/:id"',
    );
  });

  it('serializes search records, skipping empty values and repeating arrays', () => {
    expect(
      href('/search', {
        search: { q: 'milk tea', page: 2, draft: false, tag: ['a', 'b'], skip: undefined },
      }),
    ).toBe('/search?q=milk+tea&page=2&draft=false&tag=a&tag=b');
  });

  it('accepts search strings and URLSearchParams', () => {
    expect(href('/search', { search: 'q=1' })).toBe('/search?q=1');
    expect(href('/search', { search: '?q=1' })).toBe('/search?q=1');
    expect(href('/search', { search: new URLSearchParams({ q: '1' }) })).toBe('/search?q=1');
    expect(href('/search', { search: {} })).toBe('/search');
  });

  it('appends the hash', () => {
    expect(href('/about', { hash: 'team' })).toBe('/about#team');
    expect(href('/about', { hash: '#team', search: 'a=1' })).toBe('/about?a=1#team');
  });
});
