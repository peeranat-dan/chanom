---
'@chanom/vite-config': minor
---

Add shared Vitest config factories under the `@chanom/vite-config/vitest` subpath: `createVitestConfig` (base, Node), `createReactLibraryVitestConfig`, and `createReactAppVitestConfig`. Each applies opinionated defaults and deep-merges caller overrides, mirroring `createViteConfig`. They live behind a dedicated subpath so importing `createViteConfig` never pulls in `vitest/config`; `vitest` is an optional peer dependency.
