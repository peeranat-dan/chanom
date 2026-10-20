import { act } from 'react';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

// @vitest-environment jsdom
import type { SetSearch } from '../../../src/react-router/hooks/use-search-params.ts';

import useSearchParams from '../../../src/react-router/hooks/use-search-params.ts';
import { renderAt } from '../../support/render.tsx';

afterEach(() => {
  document.body.innerHTML = '';
});

interface Filters {
  readonly page: number;
  readonly tag: string[];
}

function parseFilters(params: URLSearchParams): Filters {
  return { page: Number(params.get('page') ?? 1), tag: params.getAll('tag') };
}

interface Harness<T> {
  readonly value: () => T;
  readonly set: SetSearch<T>;
  readonly search: () => string;
  readonly state: () => unknown;
}

async function setup<T>(
  useHook: () => [T, SetSearch<T>],
  path = '/list?page=2&tag=a&q=tea',
): Promise<Harness<T>> {
  const captured: [T, SetSearch<T>][] = [];
  function Capture(): null {
    captured.push(useHook());
    return null;
  }
  const { router } = await renderAt(<Capture />, path);
  const latest = (): [T, SetSearch<T>] => {
    const entry = captured.at(-1);
    if (!entry) throw new Error('useSearchParams was not rendered');
    return entry;
  };
  return {
    value: () => latest()[0],
    set: (update, options) => latest()[1](update, options),
    search: () => router.state.location.search,
    state: () => router.state.location.state,
  };
}

describe('useSearchParams', () => {
  it('reads a plain record without a parser', async () => {
    const harness = await setup(() => useSearchParams());

    expect(harness.value()).toEqual({ page: '2', tag: 'a', q: 'tea' });
    expectTypeOf(harness.value()).toEqualTypeOf<Readonly<Record<string, string | undefined>>>();
  });

  it('returns the parsed value', async () => {
    const harness = await setup(() => useSearchParams(parseFilters));

    expect(harness.value()).toEqual({ page: 2, tag: ['a'] });
    expectTypeOf(harness.value()).toEqualTypeOf<Filters>();
  });

  it('merges updates into the URL, keeping other keys', async () => {
    const harness = await setup(() => useSearchParams(parseFilters));

    await act(async () => harness.set({ page: 3, tag: ['x', 'y'] }));

    expect(harness.search()).toBe('?q=tea&page=3&tag=x&tag=y');
  });

  it('passes the parsed current value to updater functions', async () => {
    const harness = await setup(() => useSearchParams(parseFilters));

    await act(async () => harness.set((current) => ({ page: current.page + 1 })));

    expect(harness.value().page).toBe(3);
  });

  it('removes keys set to null', async () => {
    const harness = await setup(() => useSearchParams());

    await act(async () => harness.set({ q: null, tag: undefined }));

    expect(harness.search()).toBe('?page=2');
  });

  it('forwards navigate options', async () => {
    const harness = await setup(() => useSearchParams());

    await act(async () => harness.set({ page: 5 }, { state: { from: 'test' } }));

    expect(harness.search()).toBe('?tag=a&q=tea&page=5');
    expect(harness.state()).toEqual({ from: 'test' });
  });

  it('only accepts keys of the parsed shape', async () => {
    const harness = await setup(() => useSearchParams(parseFilters));
    const check = (): void => {
      // @ts-expect-error not a filter key
      harness.set({ q: 'x' });
    };

    expect(check).toBeTypeOf('function');
  });
});
