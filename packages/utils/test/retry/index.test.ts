import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import retry from '../../src/retry/index.ts';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the first successful attempt', async () => {
    const fn = vi
      .fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(new Error('flaky'))
      .mockResolvedValueOnce('ok');
    const result = retry(fn, { delay: 100 });

    await vi.advanceTimersByTimeAsync(100);

    await expect(result).resolves.toBe('ok');
    expect(fn.mock.calls).toEqual([[0], [1]]);
  });

  it('waits with exponential backoff between attempts', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('down'));
    const result = retry(fn, { retries: 2, delay: 100, factor: 3 });
    const assertion = expect(result).rejects.toThrow('down');

    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(300);
    expect(fn).toHaveBeenCalledTimes(3);

    await assertion;
  });

  it('stops early when shouldRetry returns false', async () => {
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('404'));

    await expect(retry(fn, { shouldRetry: () => false })).rejects.toThrow('404');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('rejects with the abort reason while waiting to retry', async () => {
    const controller = new AbortController();
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('down'));
    const result = retry(fn, { signal: controller.signal });
    const assertion = expect(result).rejects.toThrow('cancelled');

    await vi.advanceTimersByTimeAsync(0);
    controller.abort(new Error('cancelled'));

    await assertion;
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not call fn when the signal is already aborted', async () => {
    const fn = vi.fn<() => Promise<string>>();

    await expect(retry(fn, { signal: AbortSignal.abort(new Error('early')) })).rejects.toThrow(
      'early',
    );
    expect(fn).not.toHaveBeenCalled();
  });
});
