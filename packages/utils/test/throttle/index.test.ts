import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import throttle from '../../src/throttle/index.ts';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the first call immediately and the latest one after the cooldown', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    throttled('b');
    throttled('c');
    expect(fn.mock.calls).toEqual([['a']]);

    vi.advanceTimersByTime(100);
    expect(fn.mock.calls).toEqual([['a'], ['c']]);
  });

  it('keeps throttling while calls continue', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    vi.advanceTimersByTime(100);
    throttled('b');
    vi.advanceTimersByTime(50);
    throttled('c');
    vi.advanceTimersByTime(50);

    expect(fn.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });

  it('runs immediately again once a cooldown passes without calls', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    vi.advanceTimersByTime(100);
    throttled('b');

    expect(fn.mock.calls).toEqual([['a'], ['b']]);
  });

  it('calls fn with the this of the leading and the latest trailing call', () => {
    const seen: string[] = [];
    function record(this: { readonly name: string }): void {
      seen.push(this.name);
    }
    const throttled = throttle(record, 100);
    const a = { name: 'a', record: throttled };
    const b = { name: 'b', record: throttled };
    const c = { name: 'c', record: throttled };

    a.record();
    b.record();
    c.record();
    vi.advanceTimersByTime(100);

    expect(seen).toEqual(['a', 'c']);
  });

  it('drops the trailing call and resets the cooldown on cancel', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    throttled('b');
    throttled.cancel();
    vi.advanceTimersByTime(100);
    throttled('c');

    expect(fn.mock.calls).toEqual([['a'], ['c']]);
  });
});
