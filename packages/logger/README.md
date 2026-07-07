# @chanom/logger

Tiny, zero-dependency console logger for React apps with **environment gating** and **log-level filtering**.

Sprinkling `console.log` through a React app means either shipping noise to production or deleting the logs you'll want again next week. This logger keeps them: it decides _where_ logging is allowed (environment gating) and _how much_ gets through (level filtering), so `logger.debug(...)` can stay in the code and simply go quiet in production.

## Install

```sh
pnpm add @chanom/logger
```

## Quick start

```ts
import { logger } from '@chanom/logger';

logger.debug('cart hydrated', cart);
logger.info('user signed in');
logger.warn('slow API response', ms);
logger.error('checkout failed', error);
```

The default logger emits in `development` and `test` and is silent everywhere else. The environment is detected automatically: Vite's `import.meta.env.MODE`, then `process.env.NODE_ENV`, then `"production"` (unknown environments fail silent, not noisy).

## Configure your own

```ts
import { createLogger } from '@chanom/logger';

export const logger = createLogger({
  // Only these environments emit anything. Use "*" for all environments.
  environments: ['development', 'staging'],
  // Suppress records below this level: debug < info < warn < error.
  // "silent" turns everything off.
  level: 'info',
  // Printed as "[app]" before every record.
  prefix: 'app',
});
```

A common pattern is one module that the whole app imports from:

```ts
// src/lib/logger.ts
import { createLogger } from '@chanom/logger';

export const logger = createLogger({
  prefix: 'app',
  // Errors still surface in production; everything logs in dev.
  environments: '*',
  level: import.meta.env.DEV ? 'debug' : 'error',
});
```

## Namespaced (child) loggers

Give each feature or component its own prefix; children inherit the parent's environment gating and current level:

```ts
const cartLogger = logger.child('cart');
cartLogger.info('item added'); // [app:cart] item added

const noisy = logger.child('ws', { level: 'debug' }); // own level override
```

In a component:

```tsx
const log = logger.child('CheckoutForm');

function CheckoutForm() {
  const onSubmit = (values: FormValues) => {
    log.debug('submitting', values);
    // ...
  };
  // ...
}
```

## Runtime control

```ts
logger.setLevel('debug'); // e.g. wired to a debug toggle
logger.level; // current level
logger.environment; // environment resolved at creation

if (logger.isEnabled('debug')) {
  logger.debug('expensive', buildExpensiveReport());
}
```

`isEnabled()` with no argument reports whether the logger emits anything at all — useful to skip work that only exists to build log output.

## API

### `createLogger(options?): Logger`

| Option         | Type                       | Default                   | Description                                      |
| -------------- | -------------------------- | ------------------------- | ------------------------------------------------ |
| `level`        | `LogLevel \| 'silent'`     | `'debug'`                 | Minimum level to emit.                           |
| `environments` | `readonly string[] \| '*'` | `['development', 'test']` | Environments where the logger emits at all.      |
| `environment`  | `string`                   | auto-detected             | Override environment detection.                  |
| `prefix`       | `string`                   | –                         | Label printed as `[prefix]` before every record. |

### `Logger`

- `debug` / `info` / `warn` / `error` `(...args: unknown[]): void` — forwarded to the matching `console` method.
- `setLevel(level)` / `level` — change or read the minimum level at runtime.
- `isEnabled(level?)` — whether a record would be emitted.
- `child(prefix, { level? })` — derive a namespaced logger (prefixes joined with `:`).
- `environment` — the environment the logger resolved at creation.

### `logger`

A ready-to-use `Logger` created with the default options.
