import { describe, expect, it } from 'vitest';

import getQueryParams from '../../src/get-query-params/index.ts';

describe('getQueryParams', () => {
  it('resolves params from an absolute URL string', () => {
    expect(getQueryParams('https://example.com/p?a=1&b=two#top')).toStrictEqual({
      a: '1',
      b: 'two',
    });
  });

  it('accepts a URL instance', () => {
    expect(getQueryParams(new URL('https://example.com/?q=hello%20world'))).toStrictEqual({
      q: 'hello world',
    });
  });

  it('accepts relative paths and hash-router URLs', () => {
    expect(getQueryParams('/search?q=tea')).toStrictEqual({ q: 'tea' });
    expect(getQueryParams('/#/page?tab=info')).toStrictEqual({ tab: 'info' });
  });

  it('collects repeated keys into an array', () => {
    expect(getQueryParams('?tag=a&tag=b&page=2')).toStrictEqual({ tag: ['a', 'b'], page: '2' });
  });

  it('returns an empty object when there is no query', () => {
    expect(getQueryParams('https://example.com/p')).toStrictEqual({});
  });
});
