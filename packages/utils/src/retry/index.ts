import sleep from '../sleep/index.ts';
import getBackoffDelay from './utils/get-backoff-delay.ts';

export interface RetryOptions {
  /** Extra attempts after the first one fails. Defaults to 3. */
  readonly retries?: number;
  /** Wait (ms) before the first retry. Defaults to 200. */
  readonly delay?: number;
  /** Multiplier applied to the wait after every retry. Defaults to 2. */
  readonly factor?: number;
  /** Upper bound (ms) for a single wait. Defaults to no limit. */
  readonly maxDelay?: number;
  /** Return `false` to stop retrying, e.g. on a 4xx response. */
  readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Abort pending waits; the promise rejects with `signal.reason`. */
  readonly signal?: AbortSignal;
}

/** Run `fn` until it resolves, retrying failures with exponential backoff. */
export default async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    retries = 3,
    delay = 200,
    factor = 2,
    maxDelay = Number.POSITIVE_INFINITY,
    shouldRetry = () => true,
    signal,
  }: RetryOptions = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error, attempt)) {
        throw error;
      }
      await sleep(getBackoffDelay(attempt, { delay, factor, maxDelay }), signal);
    }
  }
}
