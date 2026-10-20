export interface BackoffOptions {
  readonly delay: number;
  readonly factor: number;
  readonly maxDelay: number;
}

/** Exponential backoff for a zero-based failed `attempt`, capped at `maxDelay`. */
export default function getBackoffDelay(
  attempt: number,
  { delay, factor, maxDelay }: BackoffOptions,
): number {
  return Math.min(delay * factor ** attempt, maxDelay);
}
