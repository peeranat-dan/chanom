import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import withTimeout from '../../src/with-timeout/index.ts';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the task value before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('done'), 100)).resolves.toBe('done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('passes through the task rejection', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 100)).rejects.toThrow('boom');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with a TimeoutError once the deadline passes', async () => {
    const result = withTimeout(new Promise(() => {}), 100);
    const assertion = expect(result).rejects.toMatchObject({ name: 'TimeoutError' });

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });

  it('aborts the signal handed to a task function on timeout', async () => {
    let taskSignal: AbortSignal | undefined;
    const result = withTimeout((signal) => {
      taskSignal = signal;
      return new Promise(() => {});
    }, 100);
    const assertion = expect(result).rejects.toMatchObject({ name: 'TimeoutError' });

    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(taskSignal?.aborted).toBe(true);
    expect(taskSignal?.reason).toMatchObject({ name: 'TimeoutError' });
  });

  it('turns a synchronous throw from the task function into a rejection', async () => {
    const result = withTimeout(() => {
      throw new Error('sync');
    }, 100);

    await expect(result).rejects.toThrow('sync');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the abort reason when aborted mid-wait', async () => {
    const controller = new AbortController();
    let taskSignal: AbortSignal | undefined;
    const result = withTimeout(
      (signal) => {
        taskSignal = signal;
        return new Promise(() => {});
      },
      100,
      controller.signal,
    );

    controller.abort(new Error('stop'));

    await expect(result).rejects.toThrow('stop');
    expect(taskSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects without running the task for an already aborted signal', async () => {
    const task = vi.fn(async () => 'never');

    await expect(withTimeout(task, 100, AbortSignal.abort(new Error('early')))).rejects.toThrow(
      'early',
    );
    expect(task).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
