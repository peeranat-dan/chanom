import { describe, expect, it } from 'vitest';

import createDeeplink from '../../src/create-deeplink/index.ts';

describe('createDeeplink', () => {
  it('builds a deeplink from scheme, path, and params', () => {
    expect(
      createDeeplink({ scheme: 'myapp', path: '/product/42', params: { ref: 'web', promo: true } }),
    ).toBe('myapp://product/42?ref=web&promo=true');
  });

  it('omits the query when there are no params', () => {
    expect(createDeeplink({ scheme: 'myapp://', path: 'home' })).toBe('myapp://home');
  });

  it('builds a bare scheme link when only the scheme is given', () => {
    expect(createDeeplink({ scheme: 'MyApp:' })).toBe('myapp://');
  });

  it('throws on an invalid scheme', () => {
    expect(() => createDeeplink({ scheme: '1app' })).toThrow(TypeError);
  });
});
