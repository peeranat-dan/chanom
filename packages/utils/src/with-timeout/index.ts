/**
 * Settle with `task`, or reject with a `TimeoutError` `DOMException` (the same
 * error `AbortSignal.timeout` uses) once `ms` milliseconds pass. Pass a function
 * to receive an `AbortSignal` that fires on timeout or abort, so the underlying
 * work (e.g. a `fetch`) can stop too. Aborting `signal` rejects with its reason.
 */
export default function withTimeout<T>(
  task: PromiseLike<T> | ((signal: AbortSignal) => PromiseLike<T>),
  ms: number,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const controller = new AbortController();
    const cleanup = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    const fail = (reason: unknown): void => {
      cleanup();
      controller.abort(reason);
      reject(reason);
    };
    const onAbort = (): void => {
      fail(signal?.reason);
    };
    const timer = setTimeout(() => {
      fail(new DOMException(`Timed out after ${ms} ms`, 'TimeoutError'));
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });

    let pending: PromiseLike<T>;
    try {
      pending = typeof task === 'function' ? task(controller.signal) : task;
    } catch (error) {
      // A synchronous throw from `task` rejects like an async failure would.
      cleanup();
      reject(error);
      return;
    }
    pending.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}
