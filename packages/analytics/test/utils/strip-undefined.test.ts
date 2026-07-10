import { describe, expect, it } from 'vitest';

import { stripUndefined } from '../../src/utils/strip-undefined.ts';

describe('stripUndefined', () => {
  it('drops undefined-valued keys and keeps everything else', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: null, d: false, e: '' })).toStrictEqual({
      a: 1,
      c: null,
      d: false,
      e: '',
    });
  });

  it('returns an empty object when every value is undefined', () => {
    expect(stripUndefined({ a: undefined, b: undefined })).toStrictEqual({});
  });
});
