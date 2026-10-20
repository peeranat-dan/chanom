import { describe, expect, it } from 'vitest';

import formatBytes from '../../src/format-bytes/index.ts';

describe('formatBytes', () => {
  it('formats with SI units by default and drops trailing zeros', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(999)).toBe('999 B');
    expect(formatBytes(1500)).toBe('1.5 KB');
    expect(formatBytes(2_000_000)).toBe('2 MB');
  });

  it('uses IEC units with binary', () => {
    expect(formatBytes(1536, { binary: true })).toBe('1.5 KiB');
    expect(formatBytes(1024 ** 3, { binary: true })).toBe('1 GiB');
  });

  it('respects decimals', () => {
    expect(formatBytes(1234, { decimals: 2 })).toBe('1.23 KB');
    expect(formatBytes(1234, { decimals: 0 })).toBe('1 KB');
  });

  it('keeps the sign of negative values', () => {
    expect(formatBytes(-1500)).toBe('-1.5 KB');
  });

  it('caps at the largest unit', () => {
    expect(formatBytes(1e18)).toBe('1000 PB');
  });

  it('keeps fractional bytes in B', () => {
    expect(formatBytes(0.5)).toBe('0.5 B');
  });
});
