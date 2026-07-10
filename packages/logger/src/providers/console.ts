import type { LogProvider } from '../types.ts';

/**
 * Provider that writes each record to the matching `console` method
 * (`console.debug`, `console.info`, …), printing the prefix as `[prefix]`.
 */
export function consoleProvider(): LogProvider {
  return {
    name: 'console',
    log: ({ level, prefix, args }) => {
      if (prefix === undefined) {
        // oxlint-disable-next-line no-console -- this package is the sanctioned console wrapper
        console[level](...args);
      } else {
        // oxlint-disable-next-line no-console -- this package is the sanctioned console wrapper
        console[level](`[${prefix}]`, ...args);
      }
    },
  };
}
