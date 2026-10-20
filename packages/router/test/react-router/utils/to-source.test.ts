import { describe, expect, it, vi } from 'vitest';

import toSource from '../../../src/react-router/utils/to-source.ts';

describe('toSource', () => {
  it('wraps importers in a lazy loader that imports once', async () => {
    const Page = (): null => null;
    const importer = vi.fn(async () => ({ default: Page }));
    const { lazy } = toSource(importer);

    expect(typeof lazy).toBe('function');
    if (typeof lazy !== 'function') return;
    await expect(lazy()).resolves.toEqual({ Component: Page });
    await lazy();
    expect(importer).toHaveBeenCalledOnce();
  });

  it('attaches eager modules directly', () => {
    const Page = (): null => null;

    expect(toSource({ default: Page })).toEqual({ Component: Page });
  });

  it('ignores anything else', () => {
    expect(toSource(undefined)).toEqual({});
  });
});
