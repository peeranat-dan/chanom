export type TryCatchResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: unknown };

/**
 * Turn a promise, or a function that may throw or reject, into a result object
 * so callers branch on `ok` instead of nesting try/catch. `error` stays `unknown`
 * because anything can be thrown.
 */
export default async function tryCatch<T>(
  task: PromiseLike<T> | (() => T | PromiseLike<T>),
): Promise<TryCatchResult<T>> {
  try {
    return { ok: true, data: await (typeof task === 'function' ? task() : task) };
  } catch (error) {
    return { ok: false, error };
  }
}
