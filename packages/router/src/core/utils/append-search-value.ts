import type { SearchValue } from '../../types.ts';

/** Appends `value` under `key`, once per array item, skipping `null` and `undefined`. */
export default function appendSearchValue(
  params: URLSearchParams,
  key: string,
  value: SearchValue | readonly SearchValue[],
): void {
  for (const item of Array.isArray(value) ? value : [value]) {
    if (item !== undefined && item !== null) params.append(key, String(item));
  }
}
