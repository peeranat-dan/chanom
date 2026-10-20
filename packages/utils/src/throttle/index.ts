export interface ThrottledFunction<Args extends unknown[], This = unknown> {
  (this: This, ...args: Args): void;
  /** Drop the pending trailing call and reset the cooldown. */
  readonly cancel: () => void;
}

/**
 * Call `fn` at most once per `wait` ms. The first call runs immediately; calls
 * made during the cooldown collapse into one trailing call with the latest
 * args and `this`, so it works as a method.
 */
export default function throttle<Args extends unknown[], This = unknown>(
  fn: (this: This, ...args: Args) => void,
  wait: number,
): ThrottledFunction<Args, This> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { readonly thisArg: This; readonly args: Args } | undefined;

  const startCooldown = (): void => {
    timer = setTimeout(() => {
      timer = undefined;
      const call = pending;
      if (call !== undefined) {
        pending = undefined;
        fn.apply(call.thisArg, call.args);
        startCooldown();
      }
    }, wait);
  };
  // A regular function, not an arrow, so callers' `this` reaches `fn`.
  const throttled = function (this: This, ...args: Args): void {
    if (timer === undefined) {
      fn.apply(this, args);
      startCooldown();
    } else {
      pending = { thisArg: this, args };
    }
  };
  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
    pending = undefined;
  };

  return Object.assign(throttled, { cancel });
}
