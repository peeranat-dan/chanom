import { describe, expect, it } from 'vitest';

import searchToRecord from '../../src/core/search-to-record.ts';

describe('searchToRecord', () => {
  it('reads each key once, keeping the first value', () => {
    expect(searchToRecord(new URLSearchParams('q=tea&tag=a&tag=b'))).toEqual({
      q: 'tea',
      tag: 'a',
    });
  });

  it('keeps keys like __proto__ as plain data', () => {
    const record = searchToRecord(new URLSearchParams('__proto__=x'));

    expect(Object.getPrototypeOf(record)).toBe(Object.prototype);
    expect(Object.hasOwn(record, '__proto__')).toBe(true);
  });

  it('is empty without params', () => {
    expect(searchToRecord(new URLSearchParams())).toEqual({});
  });
});
