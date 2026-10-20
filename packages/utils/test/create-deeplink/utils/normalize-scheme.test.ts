import { describe, expect, it } from 'vitest';

import normalizeScheme from '../../../src/create-deeplink/utils/normalize-scheme.ts';

describe('normalizeScheme', () => {
  it('strips a trailing : or :// and lower-cases', () => {
    expect(normalizeScheme('myapp')).toBe('myapp');
    expect(normalizeScheme('MyApp:')).toBe('myapp');
    expect(normalizeScheme(' my-app.v2+beta:// ')).toBe('my-app.v2+beta');
  });

  it('throws when the scheme is empty or malformed', () => {
    for (const scheme of ['', '://', '1app', 'my app', 'my_app']) {
      expect(() => normalizeScheme(scheme)).toThrow(TypeError);
    }
  });
});
