# @chanom/env

Typed, validated environment variables for Vite apps. Bring any [Standard Schema](https://standardschema.dev) validator (zod, valibot, arktype), and a missing or malformed variable fails the build, or the app at startup, with one message listing every problem.

`import.meta.env.VITE_API_URL` is typed `any` and is `undefined` when someone forgets a `.env` entry. The failure then surfaces as a confusing network error three screens deep. This package checks every variable once, up front, and gives you an object typed from your schema.

## Install

```sh
pnpm add @chanom/env zod # or valibot, arktype, ...
```

Zero runtime dependencies: the package only speaks the Standard Schema interface, so it never bundles a validator of its own.

## Usage

Keep the schema in its own file, so `vite.config.ts` can import it without touching `import.meta.env`:

```ts
// src/env.schema.ts
import { z } from 'zod';

export const envSchema = {
  VITE_API_URL: z.url(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_PAGE_SIZE: z.coerce.number().int().default(20),
};
```

```ts
// src/env.ts
import { createEnv } from '@chanom/env';

import { envSchema } from './env.schema.ts';

export const env = createEnv({ schema: envSchema, runtimeEnv: import.meta.env });
```

```ts
import { env } from './env.ts';

fetch(`${env.VITE_API_URL}/users?limit=${env.VITE_PAGE_SIZE}`); // string, number
```

`env` is frozen and holds only the keys in your schema, typed as each schema's **output**, so coercions and defaults apply.

### Fail the build, not the deploy

Add the Vite plugin with the same schema:

```ts
import { envPlugin } from '@chanom/env/vite';
// vite.config.ts
import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

import { envSchema } from './src/env.schema.ts';

export default createViteConfig({ plugins: [react(), envPlugin({ schema: envSchema })] });
```

It validates the env Vite loads (`.env*` files plus the process env, for the current mode) when `vite dev` starts or `vite build` begins:

```text
EnvValidationError: Invalid environment variables:
  - VITE_API_URL: Invalid URL
  - API_KEY: not exposed to client code; rename it to start with "VITE_"
```

The second line is a check that only the plugin can make. Vite never exposes variables without your `envPrefix` (default `VITE_`) to client code, so such a key would always be `undefined` at runtime. Vite's built-ins (`MODE`, `DEV`, `PROD`, `SSR`, `BASE_URL`) are allowed without a prefix.

`vite` is an optional peer dependency, only needed for `@chanom/env/vite`.

## API

```ts
createEnv({ schema, runtimeEnv, emptyStringAsUndefined? }): Env<typeof schema>
validateEnv(schema, runtimeEnv, { emptyStringAsUndefined? }): { ok: true, env } | { ok: false, issues }
envPlugin({ schema, emptyStringAsUndefined? }): Plugin // from '@chanom/env/vite'
```

| Option                   | Default | Notes                                                                                                |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| `schema`                 | -       | One Standard Schema per variable, keyed by name                                                      |
| `runtimeEnv`             | -       | `import.meta.env`, `process.env`, or any record                                                      |
| `emptyStringAsUndefined` | `true`  | `VITE_FOO=` in a `.env` file counts as missing, so `.optional()` and `.default()` behave as expected |

- `createEnv` throws an `EnvValidationError` with an `issues: { key, message }[]` array. It collects every failure, not just the first.
- `validateEnv` is the non-throwing version, for when you want to render your own error screen.
- Error messages name the variable and the validator's message, never the value, since env vars often hold tokens.
- Schemas must validate synchronously (env is read at module load); an async schema throws a `TypeError`.

## Not included

- **Server-only secrets.** Everything in a Vite client bundle is public. Don't put secrets in it, validated or not.
