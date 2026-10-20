import type { StorageArea } from './utils/get-web-storage.ts';

import getWebStorage from './utils/get-web-storage.ts';

export type { StorageArea } from './utils/get-web-storage.ts';

export interface StorageOptions<T> {
  /** Which Web Storage to use. Defaults to `'local'`. */
  readonly area?: StorageArea;
  /** Reject stored values of the wrong shape, e.g. written by an older app version. */
  readonly validate?: (value: unknown) => value is T;
}

export interface StorageItem<T> {
  /** The stored value, or `undefined` if missing, unparsable, invalid, or unavailable. */
  readonly get: () => T | undefined;
  /** Store `value` as JSON. Returns `false` if storage is unavailable or full. */
  readonly set: (value: T) => boolean;
  readonly remove: () => void;
}

/**
 * A typed, JSON-backed handle on one Web Storage key that never throws: private
 * mode, blocked site data, a full quota, corrupt JSON, and SSR all degrade to
 * `undefined` / `false` instead.
 */
export default function storage<T>(
  key: string,
  { area = 'local', validate }: StorageOptions<T> = {},
): StorageItem<T> {
  return {
    get: () => {
      try {
        const raw = getWebStorage(area)?.getItem(key);
        if (raw === null || raw === undefined) {
          return undefined;
        }
        const value: unknown = JSON.parse(raw);
        // Without `validate` the caller vouches for the shape, as with `JSON.parse`.
        return validate === undefined || validate(value) ? (value as T) : undefined;
      } catch {
        return undefined;
      }
    },
    set: (value) => {
      const webStorage = getWebStorage(area);
      if (webStorage === undefined) {
        return false;
      }
      try {
        webStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove: () => {
      try {
        getWebStorage(area)?.removeItem(key);
      } catch {
        // Nothing to clean up if storage is unusable.
      }
    },
  };
}
