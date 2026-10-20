import { describe, expect, it, vi } from 'vitest';

import once from '../../../src/react-router/utils/once.ts';

describe('once', () => {
  it('shares one load between callers', async () => {
    const load = vi.fn(async () => 'module');
    const shared = once(load);

    await expect(Promise.all([shared(), shared()])).resolves.toEqual(['module', 'module']);
    expect(load).toHaveBeenCalledOnce();
  });

  it('loads again after a failure', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue('module');
    const shared = once(load);

    await expect(shared()).rejects.toThrow('offline');
    await expect(shared()).resolves.toBe('module');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
