import { describe, expect, it } from 'vitest';

import cn from '../../src/cn/index.ts';

describe('cn', () => {
  it('joins strings, arrays, and object maps while skipping falsy values', () => {
    const classes = (isActive: boolean): string =>
      cn('a', ['b', isActive && 'c'], { d: true, e: false }, undefined, null);

    expect(classes(false)).toBe('a b d');
    expect(classes(true)).toBe('a b c d');
  });

  it('lets the last conflicting Tailwind class win', () => {
    expect(cn('px-2 py-1 text-red-500', 'px-4', 'text-blue-500')).toBe('py-1 px-4 text-blue-500');
  });

  it('returns an empty string with no classes', () => {
    expect(cn()).toBe('');
  });
});
