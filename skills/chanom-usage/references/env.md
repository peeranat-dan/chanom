# @chanom/env

Typed, validated env vars from any Standard Schema validator (zod, valibot,
arktype). Zero runtime deps; install a validator alongside it. Reuse the
project's validator if it has one; otherwise use zod.

## Wire

Split the schema from the env object, so `vite.config.ts` can import the schema
without evaluating `import.meta.env`:

```ts
// src/env.schema.ts
import { z } from 'zod';

export const envSchema = {
  VITE_API_URL: z.url(),
  VITE_SENTRY_DSN: z.string().optional(),
};
```

```ts
// src/env.ts
import { createEnv } from '@chanom/env';

import { envSchema } from './env.schema.ts';

export const env = createEnv({ schema: envSchema, runtimeEnv: import.meta.env });
```

Add the build-time check to `vite.config.ts` plugins:

```ts
import { envPlugin } from '@chanom/env/vite';

import { envSchema } from './src/env.schema.ts';

// plugins: [react(), envPlugin({ schema: envSchema })]
```

## Rules

- Replace every direct `import.meta.env.VITE_*` read with `env.VITE_*`, and add
  each variable to the schema. Vite built-ins (`import.meta.env.DEV`, `MODE`)
  can stay direct.
- Client keys need the `VITE_` prefix (or the project's `envPrefix`); the plugin
  fails on keys without it.
- Use `z.coerce.number()` / `z.stringbool()` for non-string values: env values
  are always strings.
- Add new variables to `.env.example` too, if the project has one.
- Never put secrets in the schema of a client app; everything in it ships to
  the browser.
