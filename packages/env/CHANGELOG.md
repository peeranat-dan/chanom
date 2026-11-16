# @chanom/env

## 0.2.0

### Minor Changes

- 4e04f3f: Add a `skipValidation` option to `envPlugin`, for builds without a real env (e.g. CI). The `envPrefix` check still runs.

## 0.1.1

### Patch Changes

- c09feb5: Allow client code to read a variable declared in both `server` and `client`, instead of throwing as if it were server-only.

## 0.1.0

### Minor Changes

- 3a6b266: Add `@chanom/env`: typed, validated environment variables from any Standard Schema validator, with `createEnv` for startup checks and an `envPlugin` (`@chanom/env/vite`) that fails `vite dev` / `vite build` on invalid or unexposed variables.
- 5ecb26f: Split `createEnv` schemas into `server` and `client`, for Node servers (Firebase Functions, SSR) as well as Vite apps. On the client only `client` is validated, and reading a `server` variable throws. `envPlugin` now takes `client` instead of `schema`.
