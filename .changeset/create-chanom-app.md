---
'create-chanom-app': minor
---

Add `create-chanom-app`, a standalone scaffolder for Vite + React + TypeScript apps wired to the chanom shared configs. Ships a minimal-but-wired baseline (oxlint, oxfmt, Vitest + Testing Library, a local tsconfig) with every dependency pinned exact from the workspace catalog, plus an optional `commit-hooks` topping (husky + lint-staged + commitlint). Run it with `pnpm create chanom-app`, `npm create chanom-app`, or `yarn create chanom-app`.
