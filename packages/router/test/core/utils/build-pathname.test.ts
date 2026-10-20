import { describe, expect, it } from 'vitest';

import buildPathname from '../../../src/core/utils/build-pathname.ts';

describe('buildPathname', () => {
  it('keeps static segments', () => {
    expect(buildPathname('/about/team', {})).toBe('/about/team');
    expect(buildPathname('/', {})).toBe('/');
  });

  it('fills and encodes params', () => {
    expect(buildPathname('/posts/:id', { id: 'a b/c' })).toBe('/posts/a%20b%2Fc');
  });

  it('drops optional params without a value', () => {
    expect(buildPathname('/:lang?/docs', {})).toBe('/docs');
    expect(buildPathname('/:lang?/docs', { lang: '' })).toBe('/docs');
    expect(buildPathname('/:lang?/docs', { lang: 'th' })).toBe('/th/docs');
  });

  it('keeps slashes in splat values', () => {
    expect(buildPathname('/files/*', { '*': 'a b/c' })).toBe('/files/a%20b/c');
    expect(buildPathname('/files/*', {})).toBe('/files');
  });

  it('throws when a required param is missing', () => {
    expect(() => buildPathname('/posts/:id', {})).toThrow(
      'Missing param "id" for path "/posts/:id"',
    );
  });
});
