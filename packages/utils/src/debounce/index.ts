export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Drop the pending call, if any. */
  readonly cancel: () => void;
  /** Run the pending call now instead of waiting, if any. */
  readonly flush: () => void;
}

/** Delay calls to `fn` until `wait` ms have passed without another call. */
export default function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
): DebouncedFunction<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: Args | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
    pendingArgs = undefined;
  };
  const flush = (): void => {
    const args = pendingArgs;
    cancel();
    if (args !== undefined) {
      fn(...args);
    }
  };
  const debounced = (...args: Args): void => {
    clearTimeout(timer);
    pendingArgs = args;
    timer = setTimeout(flush, wait);
  };

  return Object.assign(debounced, { cancel, flush });
}
