import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import debounce from '../../src/debounce/index.ts';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls once with the latest args after the wait settles', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    vi.advanceTimersByTime(50);
    debounced('b');
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('drops the pending call on cancel', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).not.toHaveBeenCalled();
  });

  it('runs the pending call immediately on flush, and only once', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced.flush();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('does nothing on flush when no call is pending', () => {
    const fn = vi.fn();
    debounce(fn, 100).flush();

    expect(fn).not.toHaveBeenCalled();
  });
});
