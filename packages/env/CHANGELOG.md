# @chanom/env

## 0.1.0

### Minor Changes

- 3a6b266: Add `@chanom/env`: typed, validated environment variables from any Standard Schema validator, with `createEnv` for startup checks and an `envPlugin` (`@chanom/env/vite`) that fails `vite dev` / `vite build` on invalid or unexposed variables.
- 5ecb26f: Split `createEnv` schemas into `server` and `client`, for Node servers (Firebase Functions, SSR) as well as Vite apps. On the client only `client` is validated, and reading a `server` variable throws. `envPlugin` now takes `client` instead of `schema`.
