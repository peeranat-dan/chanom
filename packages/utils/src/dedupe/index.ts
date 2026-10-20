/**
 * Share one in-flight promise between calls with the same key, e.g. several
 * components fetching the same user at once. The entry is dropped as soon as the
 * promise settles, so the next call runs `fn` again (no caching of results).
 * Keys default to `JSON.stringify(args)`; pass `getKey` for args that do not
 * serialise well.
 */
export default function dedupe<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  getKey: (...args: Args) => unknown = (...args) => JSON.stringify(args),
): (...args: Args) => Promise<T> {
  const pending = new Map<unknown, Promise<T>>();

  return (...args) => {
    const key = getKey(...args);
    const existing = pending.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const promise = fn(...args);
    pending.set(key, promise);
    // `.then` with both handlers instead of `.finally`, which would re-throw the
    // rejection on a new promise that nobody handles.
    const release = (): void => {
      pending.delete(key);
    };
    promise.then(release, release);
    return promise;
  };
}
