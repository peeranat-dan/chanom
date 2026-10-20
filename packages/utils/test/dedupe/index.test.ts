import { describe, expect, it, vi } from 'vitest';

import dedupe from '../../src/dedupe/index.ts';

describe('dedupe', () => {
  it('shares one in-flight promise between calls with the same args', async () => {
    let resolve: (value: string) => void = () => {};
    const promise = new Promise<string>((done) => {
      resolve = done;
    });
    const fn = vi.fn((_id: number) => promise);
    const fetchUser = dedupe(fn);

    const first = fetchUser(1);
    const second = fetchUser(1);
    resolve('ada');

    expect(second).toBe(first);
    await expect(first).resolves.toBe('ada');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('runs separately for different args', () => {
    const fn = vi.fn(async (id: number) => id);
    const fetchUser = dedupe(fn);

    void fetchUser(1);
    void fetchUser(2);

    expect(fn.mock.calls).toEqual([[1], [2]]);
  });

  it('runs again once the previous promise has resolved', async () => {
    const fn = vi.fn(async (id: number) => id);
    const fetchUser = dedupe(fn);

    await fetchUser(1);
    await fetchUser(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('runs again once the previous promise has rejected', async () => {
    const fn = vi.fn(async () => {
      throw new Error('boom');
    });
    const load = dedupe(fn);

    await expect(load()).rejects.toThrow('boom');
    await expect(load()).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('groups calls by a custom key', () => {
    const fn = vi.fn(async (user: { readonly id: number; readonly name: string }) => user.id);
    const save = dedupe(fn, (user) => user.id);

    const first = save({ id: 1, name: 'a' });
    const second = save({ id: 1, name: 'b' });

    expect(second).toBe(first);
    expect(fn).toHaveBeenCalledOnce();
  });
});
