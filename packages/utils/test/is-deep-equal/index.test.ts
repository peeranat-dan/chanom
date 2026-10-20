import { describe, expect, it } from 'vitest';

import isDeepEqual from '../../src/is-deep-equal/index.ts';

describe('isDeepEqual', () => {
  it('compares primitives, treating NaN as equal to itself', () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual('a', 'b')).toBe(false);
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isDeepEqual(null, undefined)).toBe(false);
    expect(isDeepEqual(0, '0')).toBe(false);
  });

  it('compares nested plain objects and arrays', () => {
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false);
    expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('ignores key order but not missing keys', () => {
    expect(isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(isDeepEqual({ a: undefined }, { b: undefined })).toBe(false);
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('tells arrays and objects apart', () => {
    expect(isDeepEqual([], {})).toBe(false);
    expect(isDeepEqual({ 0: 'a', length: 1 }, ['a'])).toBe(false);
  });

  it('compares dates by time and regexps by source and flags', () => {
    expect(isDeepEqual(new Date(0), new Date(0))).toBe(true);
    expect(isDeepEqual(new Date(0), new Date(1))).toBe(false);
    expect(isDeepEqual(/a/g, /a/g)).toBe(true);
    expect(isDeepEqual(/a/g, /a/i)).toBe(false);
  });

  it('compares maps by key and deep value', () => {
    expect(isDeepEqual(new Map([['a', { b: 1 }]]), new Map([['a', { b: 1 }]]))).toBe(true);
    expect(isDeepEqual(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
    expect(isDeepEqual(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false);
  });

  it('compares sets by deep membership', () => {
    expect(isDeepEqual(new Set([1, { a: 1 }]), new Set([{ a: 1 }, 1]))).toBe(true);
    expect(isDeepEqual(new Set([{ a: 1 }]), new Set([{ a: 2 }]))).toBe(false);
    expect(isDeepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it('compares class instances by reference', () => {
    const url = new URL('https://a.test');

    expect(isDeepEqual(url, url)).toBe(true);
    expect(isDeepEqual(new URL('https://a.test'), new URL('https://b.test'))).toBe(false);
    expect(isDeepEqual(Object.create(null), {})).toBe(false);
  });

  it('handles cycles', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a['self'] = a;
    const b: Record<string, unknown> = { name: 'a' };
    b['self'] = b;
    const c: Record<string, unknown> = { name: 'c' };
    c['self'] = c;

    expect(isDeepEqual(a, b)).toBe(true);
    expect(isDeepEqual(a, c)).toBe(false);
  });

  it('terminates when one object meets cycles of different lengths', () => {
    const a: Record<string, unknown> = {};
    a['next'] = a;
    const b: Record<string, unknown> = {};
    const b2: Record<string, unknown> = { next: b };
    b['next'] = b2;

    expect(isDeepEqual(a, b)).toBe(true);
  });
});
