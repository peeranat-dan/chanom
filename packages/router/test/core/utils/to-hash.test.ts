import { describe, expect, it } from 'vitest';

import toHash from '../../../src/core/utils/to-hash.ts';

describe('toHash', () => {
  it('adds a missing #', () => {
    expect(toHash('top')).toBe('#top');
    expect(toHash('#top')).toBe('#top');
  });

  it('is empty for missing or empty input', () => {
    expect(toHash(undefined)).toBe('');
    expect(toHash('')).toBe('');
  });
});
