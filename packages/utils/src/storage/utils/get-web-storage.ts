export type StorageArea = 'local' | 'session';

/**
 * Resolve `localStorage` or `sessionStorage`, or `undefined` when it is missing
 * (SSR) or blocked: some browsers throw a `SecurityError` on mere property
 * access when site data is disabled.
 */
export default function getWebStorage(area: StorageArea): Storage | undefined {
  try {
    const storage: Storage | undefined =
      area === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    return storage ?? undefined;
  } catch {
    return undefined;
  }
}
