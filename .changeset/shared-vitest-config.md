---
'@chanom/vite-config': minor
---

Add shared Vitest config factories: `createVitestConfig` (base, Node), `createReactLibraryVitestConfig`, and `createReactAppVitestConfig`. Each applies opinionated defaults and deep-merges caller overrides, mirroring `createViteConfig`. `vitest` is now a peer dependency.
