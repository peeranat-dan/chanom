import type { SearchUpdate } from '../types.ts';

import appendSearchValue from './utils/append-search-value.ts';

/** Copies `current` with every key in `update` replaced; keys left out of `update` are kept. */
export default function applySearchUpdate(
  current: URLSearchParams,
  update: SearchUpdate,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(update)) {
    next.delete(key);
    appendSearchValue(next, key, value);
  }
  return next;
}
