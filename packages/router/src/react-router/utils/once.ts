/** Shares one in-flight `load()` between all callers; forgets failures so a retry calls `load` again. */
export default function once<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | undefined;
  return () => {
    promise ??= load().catch((error: unknown) => {
      promise = undefined;
      throw error;
    });
    return promise;
  };
}
