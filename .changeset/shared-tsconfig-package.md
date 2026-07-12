---
'@chanom/tsconfig': minor
'@chanom/cli': patch
'@chanom/dev-config': patch
'@chanom/vite-config': patch
---

Add `@chanom/tsconfig`, a shared TypeScript config package exposing `base`, `node-lts`, `node-ts`, and `node-lts-ts` presets. The `cli`, `dev-config`, and `vite-config` packages now extend these presets instead of wiring the `@tsconfig/*` base chain directly.
