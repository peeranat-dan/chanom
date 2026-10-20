import type { SearchInit } from '../../types.ts';

import appendSearchValue from './append-search-value.ts';

/** Serializes a search init into `?query`, or `''` when it is empty. */
export default function toSearch(search: SearchInit | undefined): string {
  if (search === undefined) return '';
  if (typeof search === 'string') {
    return search === '' || search.startsWith('?') ? search : `?${search}`;
  }

  let query = search;
  if (!(search instanceof URLSearchParams)) {
    query = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) appendSearchValue(query, key, value);
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}
