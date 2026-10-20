export interface DebouncedFunction<Args extends unknown[], This = unknown> {
  (this: This, ...args: Args): void;
  /** Drop the pending call, if any. */
  readonly cancel: () => void;
  /** Run the pending call now instead of waiting, if any. */
  readonly flush: () => void;
}

/**
 * Delay calls to `fn` until `wait` ms have passed without another call. `fn`
 * runs with the args and `this` of the latest call, so it works as a method.
 */
export default function debounce<Args extends unknown[], This = unknown>(
  fn: (this: This, ...args: Args) => void,
  wait: number,
): DebouncedFunction<Args, This> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { readonly thisArg: This; readonly args: Args } | undefined;

  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };
  const flush = (): void => {
    const call = pending;
    cancel();
    if (call !== undefined) {
      fn.apply(call.thisArg, call.args);
    }
  };
  // A regular function, not an arrow, so callers' `this` reaches `fn`.
  const debounced = function (this: This, ...args: Args): void {
    clearTimeout(timer);
    pending = { thisArg: this, args };
    timer = setTimeout(flush, wait);
  };

  return Object.assign(debounced, { cancel, flush });
}
