# @chanom/vite-config

## 0.1.0

### Minor Changes

- 9560413: Add shared Vitest config factories under the `@chanom/vite-config/vitest` subpath: `createVitestConfig` (base, Node), `createReactLibraryVitestConfig`, and `createReactAppVitestConfig`. Each applies opinionated defaults and deep-merges caller overrides, mirroring `createViteConfig`. They live behind a dedicated subpath so importing `createViteConfig` never pulls in `vitest/config`; `vitest` is an optional peer dependency.

## 0.0.1

### Patch Changes

- add initial optimized initial vite config for react apps and libraries
