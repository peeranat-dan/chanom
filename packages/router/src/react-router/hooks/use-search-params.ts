import type { NavigateOptions } from 'react-router';

import { useCallback, useMemo } from 'react';
import { useSearchParams as useRouterSearchParams } from 'react-router';

import type { SearchUpdate } from '../../types.ts';

import applySearchUpdate from '../../core/apply-search-update.ts';
import searchToRecord from '../../core/search-to-record.ts';

/** Merges `update` into the current search params; keys it leaves out are kept. */
export type SetSearch<T> = (
  update: SearchUpdate<T> | ((current: T) => SearchUpdate<T>),
  options?: NavigateOptions,
) => void;

type SearchRecord = Readonly<Record<string, string | undefined>>;

/**
 * Typed search params. Without a parser you get a plain record; with one you
 * get whatever it returns, and the setter only accepts that shape's keys.
 * Define the parser outside the component so the parsed value stays memoized.
 *
 * ```ts
 * const parseFilters = (params: URLSearchParams) => ({
 *   page: Number(params.get('page') ?? 1),
 *   tags: params.getAll('tag'),
 * });
 *
 * const [filters, setFilters] = useSearchParams(parseFilters);
 * setFilters({ page: filters.page + 1 });          // other keys are kept
 * setFilters((current) => ({ page: null }));       // null removes a key
 * ```
 */
export default function useSearchParams(): [SearchRecord, SetSearch<SearchRecord>];
export default function useSearchParams<T>(
  parse: (params: URLSearchParams) => T,
): [T, SetSearch<T>];
export default function useSearchParams(
  parse: (params: URLSearchParams) => unknown = searchToRecord,
): [unknown, SetSearch<Record<string, unknown>>] {
  const [searchParams, setSearchParams] = useRouterSearchParams();
  const value = useMemo(() => parse(searchParams), [parse, searchParams]);

  const setSearch = useCallback<SetSearch<Record<string, unknown>>>(
    (update, options) => {
      setSearchParams((current) => {
        const changes =
          typeof update === 'function' ? update(parse(current) as Record<string, unknown>) : update;
        return applySearchUpdate(current, changes);
      }, options);
    },
    [parse, setSearchParams],
  );

  return [value, setSearch];
}
