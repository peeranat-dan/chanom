# @chanom/vite-config

## 0.1.1

### Patch Changes

- 1eaf9b0: Fix a type mismatch in `CreateVitestConfigOptions.plugins`. The option was typed
  as `PluginOption[]` imported from `vite`, but Vitest resolves its own copy of
  Vite, so plugins created against that copy were not assignable and consumers hit
  errors when passing framework plugins such as `@vitejs/plugin-react`. The option
  is now typed as `VitestPluginOption[]`, derived from `ViteUserConfig['plugins']`
  in `vitest/config`, so it always matches the config Vitest actually consumes.

## 0.1.0

### Minor Changes

- 9560413: Add shared Vitest config factories under the `@chanom/vite-config/vitest` subpath: `createVitestConfig` (base, Node), `createReactLibraryVitestConfig`, and `createReactAppVitestConfig`. Each applies opinionated defaults and deep-merges caller overrides, mirroring `createViteConfig`. They live behind a dedicated subpath so importing `createViteConfig` never pulls in `vitest/config`; `vitest` is an optional peer dependency.

## 0.0.1

### Patch Changes

- add initial optimized initial vite config for react apps and libraries
