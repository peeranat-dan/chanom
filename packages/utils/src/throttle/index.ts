export interface ThrottledFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Drop the pending trailing call and reset the cooldown. */
  readonly cancel: () => void;
}

/**
 * Call `fn` at most once per `wait` ms. The first call runs immediately; calls
 * made during the cooldown collapse into one trailing call with the latest args.
 */
export default function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
): ThrottledFunction<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: Args | undefined;

  const startCooldown = (): void => {
    timer = setTimeout(() => {
      timer = undefined;
      const args = pendingArgs;
      if (args !== undefined) {
        pendingArgs = undefined;
        fn(...args);
        startCooldown();
      }
    }, wait);
  };
  const throttled = (...args: Args): void => {
    if (timer === undefined) {
      fn(...args);
      startCooldown();
    } else {
      pendingArgs = args;
    }
  };
  const cancel = (): void => {
    clearTimeout(timer);
    timer = undefined;
    pendingArgs = undefined;
  };

  return Object.assign(throttled, { cancel });
}
