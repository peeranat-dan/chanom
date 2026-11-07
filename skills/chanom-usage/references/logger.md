# @chanom/logger

Zero-dependency logger with an `enabled` switch and level filtering
(`debug < info < warn < error`). Records fan out to providers; the default is
the console. It never reads env vars itself - you pass the switch.

## Wire

Create `src/lib/logger.ts` and import `logger` from it everywhere:

```ts
import { createLogger } from '@chanom/logger';

export const logger = createLogger({
  prefix: 'app',
  // Everything in dev, errors only in production.
  level: import.meta.env.DEV ? 'debug' : 'error',
});
```

Use `enabled: import.meta.env.DEV` instead of `level` when the user wants
production fully silent.

Per feature or component, derive a child (prefixes join with `:`):

```ts
const log = logger.child('cart');
log.info('item added'); // [app:cart] item added
```

## Rules

- Replace each `console.*` call with the matching `logger` / child method. The
  chanom oxlint preset errors on `no-console`, so leftover calls fail lint.
- Guard expensive log payloads: `if (logger.isEnabled('debug')) { ... }`.
- A custom destination (Sentry, a remote endpoint) is `{ name, log(record) }`,
  typed `LogProvider`. Keep `consoleProvider()` in `providers` alongside it
  when console output is still wanted.
