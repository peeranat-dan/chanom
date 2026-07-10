# @chanom/logger

Tiny, zero-dependency, provider-agnostic logger for web apps with an **enabled switch** and **log-level filtering**.

Sprinkling `console.log` through an app means either shipping noise to production or deleting the logs you'll want again next week. This logger keeps them: you decide _whether_ logging is on (the `enabled` switch - wire it to `import.meta.env.DEV`, an env var, or a feature flag) and _how much_ gets through (level filtering), so `logger.debug(...)` can stay in the code and simply go quiet in production. Records fan out to providers - the built-in console provider by default, or any destination you implement.

## Install

```sh
pnpm add @chanom/logger
```

## Quick start

```ts
import { createLogger } from '@chanom/logger';

const logger = createLogger({ enabled: import.meta.env.DEV });

logger.debug('cart hydrated', cart);
logger.info('user signed in');
logger.warn('slow API response', ms);
logger.error('checkout failed', error);
```

The package never reads `import.meta.env` or `process.env` itself - you pass the switch, so it works the same under Vite, Node, SSR, or tests.

## Configure your own

A common pattern is one module that the whole app imports from:

```ts
// src/lib/logger.ts
import { createLogger } from '@chanom/logger';

export const logger = createLogger({
  // Master switch; a function is re-evaluated on every call.
  enabled: import.meta.env.DEV,
  // Suppress records below this level: debug < info < warn < error.
  level: 'info',
  // Printed as "[app]" before every record.
  prefix: 'app',
});
```

To keep errors surfacing in production, leave the logger enabled and filter by level instead:

```ts
export const logger = createLogger({
  prefix: 'app',
  // Errors still surface in production; everything logs in dev.
  level: import.meta.env.DEV ? 'debug' : 'error',
});
```

## Providers

Every record fans out to all providers, in order. The default is the built-in console provider; add your own to also ship records elsewhere:

```ts
import { type LogProvider, consoleProvider, createLogger } from '@chanom/logger';

const sentryBreadcrumbs: LogProvider = {
  name: 'sentry-breadcrumbs',
  log: ({ level, prefix, args }) => {
    Sentry.addBreadcrumb({ level, category: prefix, message: args.map(String).join(' ') });
  },
};

export const logger = createLogger({
  providers: [consoleProvider(), sentryBreadcrumbs],
});
```

Providers are isolated from each other: one that throws is reported via `onError` (default: `console.error`) and the rest still run.

## Namespaced (child) loggers

Give each feature or component its own prefix; children inherit the parent's providers, enabled switch, and current level:

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

if (logger.isEnabled('debug')) {
  logger.debug('expensive', buildExpensiveReport());
}
```

`isEnabled()` with no argument reports whether the logger emits anything at all - useful to skip work that only exists to build log output.

## API

### `createLogger(options?): Logger`

| Option      | Type                            | Default               | Description                                             |
| ----------- | ------------------------------- | --------------------- | ------------------------------------------------------- |
| `providers` | `readonly LogProvider[]`        | `[consoleProvider()]` | Destinations every record fans out to, in order.        |
| `enabled`   | `boolean \| (() => boolean)`    | `true`                | Master switch; a function is re-evaluated per call.     |
| `level`     | `LogLevel`                      | `'debug'`             | Minimum level to emit.                                  |
| `prefix`    | `string`                        | –                     | Label passed as `record.prefix`, printed as `[prefix]`. |
| `onError`   | `(error, { provider }) => void` | `console.error`       | Called when a provider throws.                          |

### `Logger`

- `debug` / `info` / `warn` / `error` `(...args: unknown[]): void` — fan a record out to every provider.
- `setLevel(level)` / `level` — change or read the minimum level at runtime.
- `isEnabled(level?)` — whether a record would be emitted.
- `child(prefix, { level? })` — derive a namespaced logger (prefixes joined with `:`).

### `LogProvider`

Implement `{ name, log(record) }` to write records anywhere. `record` is `{ level, prefix?, args }`; it only ever contains records that passed the enabled and level checks.

### `consoleProvider(): LogProvider`

The built-in provider: writes each record to the matching `console` method, printing the prefix as `[prefix]`.
