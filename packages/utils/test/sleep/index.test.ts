import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import sleep from '../../src/sleep/index.ts';

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the given time', async () => {
    const onDone = vi.fn();
    void sleep(100).then(onDone);

    await vi.advanceTimersByTimeAsync(99);
    expect(onDone).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('rejects with the abort reason when aborted mid-wait', async () => {
    const controller = new AbortController();
    const result = sleep(100, controller.signal);

    controller.abort(new Error('stop'));

    await expect(result).rejects.toThrow('stop');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects immediately for an already aborted signal', async () => {
    await expect(sleep(100, AbortSignal.abort(new Error('early')))).rejects.toThrow('early');
    expect(vi.getTimerCount()).toBe(0);
  });
});
