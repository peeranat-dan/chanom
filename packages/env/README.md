# @chanom/env

Typed, validated environment variables for Vite apps and Node servers (Firebase Functions, scripts, SSR). Bring any [Standard Schema](https://standardschema.dev) validator (zod, valibot, arktype), and a missing or malformed variable fails the build, or the app at startup, with one message listing every problem.

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

export const clientSchema = {
  VITE_API_URL: z.url(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_PAGE_SIZE: z.coerce.number().int().default(20),
};
```

```ts
// src/env.ts
import { createEnv } from '@chanom/env';

import { clientSchema } from './env.schema.ts';

export const env = createEnv({ client: clientSchema, runtimeEnv: import.meta.env });
```

```ts
import { env } from './env.ts';

fetch(`${env.VITE_API_URL}/users?limit=${env.VITE_PAGE_SIZE}`); // string, number
```

`env` is frozen and holds only the keys in your schemas, typed as each schema's **output**, so coercions and defaults apply.

### Server and client variables

Split variables by who may read them. `server` holds secrets; `client` holds what is safe to ship to the browser:

```ts
import { createEnv } from '@chanom/env';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    STRIPE_SECRET_KEY: z.string(),
  },
  client: {
    VITE_API_URL: z.url(),
  },
  runtimeEnv: process.env,
});
```

- **On the server**, both schemas are validated.
- **On the client**, only `client` is validated, since the server variables are not in the bundle. Reading `env.STRIPE_SECRET_KEY` there throws instead of returning `undefined`, so a secret used in shared code fails loudly.

The side is detected from a global `window`. Pass `isServer` to override it, e.g. in a jsdom test.

A pure server, like Firebase Functions, needs only `server`:

```ts
// functions/src/env.ts
export const env = createEnv({
  server: { OPENAI_API_KEY: z.string(), REGION: z.string().default('asia-southeast1') },
  runtimeEnv: process.env,
});
```

### Fail the build, not the deploy

Add the Vite plugin with the same schema:

```ts
import { envPlugin } from '@chanom/env/vite';
// vite.config.ts
import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

import { clientSchema } from './src/env.schema.ts';

export default createViteConfig({ plugins: [react(), envPlugin({ client: clientSchema })] });
```

It validates the env Vite loads (`.env*` files plus the process env, for the current mode) when `vite dev` starts or `vite build` begins:

```text
EnvValidationError: Invalid environment variables:
  - VITE_API_URL: Invalid URL
  - API_KEY: not exposed to client code; rename it to start with "VITE_"
```

The plugin checks only `client`: server variables are read at runtime, where `createEnv` validates them. The second line is a check that only the plugin can make. Vite never exposes variables without your `envPrefix` (default `VITE_`) to client code, so such a key would always be `undefined` at runtime. Vite's built-ins (`MODE`, `DEV`, `PROD`, `SSR`, `BASE_URL`) are allowed without a prefix.

`vite` is an optional peer dependency, only needed for `@chanom/env/vite`.

## API

```ts
createEnv({ server?, client?, runtimeEnv, isServer?, emptyStringAsUndefined? }): Env<Server & Client>
validateEnv(schema, runtimeEnv, { emptyStringAsUndefined? }): { ok: true, env } | { ok: false, issues }
envPlugin({ client, emptyStringAsUndefined?, skipValidation? }): Plugin // from '@chanom/env/vite'
```

| Option                   | Default | Notes                                                                                                |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| `server`                 | `{}`    | Server-only variables, one Standard Schema each, keyed by name                                       |
| `client`                 | `{}`    | Browser-safe variables, same shape                                                                   |
| `isServer`               | auto    | `true` when there is no global `window`                                                              |
| `runtimeEnv`             | -       | `import.meta.env`, `process.env`, or any record                                                      |
| `emptyStringAsUndefined` | `true`  | `VITE_FOO=` in a `.env` file counts as missing, so `.optional()` and `.default()` behave as expected |
| `skipValidation`         | `false` | `envPlugin` only. Skip value checks (e.g. a CI build with no real env); the prefix check still runs  |

- `createEnv` throws an `EnvValidationError` with an `issues: { key, message, path? }[]` array (`path` locates the failure inside a nested schema output). It collects every failure, not just the first.
- `validateEnv` is the non-throwing version, for when you want to render your own error screen.
- Error messages name the variable and the validator's message, never the value, since env vars often hold tokens.
- Schemas must validate synchronously (env is read at module load); an async schema throws a `TypeError`.

## Not included

- **Client prefix checks outside Vite.** `envPlugin` makes sure every `client` key carries Vite's `envPrefix`. Other bundlers get no such check, so keep secrets out of `client` yourself: everything in a client bundle is public, validated or not.
