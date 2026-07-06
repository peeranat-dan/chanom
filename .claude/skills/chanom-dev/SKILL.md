---
name: chanom-dev
description: Implement code in the chanom monorepo. Use when adding or changing code in packages/cli, packages/dev-config, or packages/vite-config, or when committing work in this repo.
---

# Working in chanom

pnpm + turbo monorepo. Workspace packages live in `packages/*` and `apps/*`.

## Package structure

Match the existing layout of the package you touch:

- **@chanom/cli** (`packages/cli`) - layered Effect architecture:
  - `src/domain/` - pure data and functions, no I/O (Pkg helpers, script planning, PM resolution, setup-file candidates).
  - `src/services/` - `Effect.Service` capabilities with live layers: `Prompter` (clack), `CommandRunner` (process spawning), `Git`, `PackageInstaller`. All side effects go through a service or `FileSystem`/`Path` from `@effect/platform`.
  - `src/commands/<name>/` - pure, side-effect-free logic in `logic.ts`; effectful orchestration using the services in `index.ts`. `apply` functions return an updated `Pkg` instead of mutating.
  - `src/utils/` - cross-command Effect helpers over `FileSystem`/`Path` (read/write package.json, detect setup files, detect PM).
  - `src/cli.ts` - command dispatch and error-to-exit-code mapping; `src/index.ts` - bin entry wiring live layers via `NodeContext`.
  - `test/` - vitest + `@effect/vitest` unit tests mirroring `src/`; in-memory/stub layers live in `test/support/` (`makeTestFs`, `makeTestPrompter`, `makeTestRunner`, `makeTestEnv`). New code in a layer gets a matching test.
- **@chanom/dev-config** (`packages/dev-config`) - one folder per tool `src/<tool>/` with `index.ts` (config factory) and `base-config.ts`. A new tool also needs `./<tool>/config` and `./<tool>/base` entries in package.json `exports`, mirroring the `development`/`types`/`default` conditions of existing entries.
- **@chanom/vite-config** (`packages/vite-config`) - single entry point; everything exports from `src/index.ts`.

Dependencies: versions come from the pnpm catalog (`pnpm-workspace.yaml`, `catalogMode: strict`) - declare as `"catalog:"` and add the pinned version to the catalog if missing. Intra-repo deps use `"workspace:*"`.

## Verify

After implementing, from the repo root:

```sh
pnpm turbo run build
pnpm turbo run test
pnpm lint
```

Done only when all three exit clean. On failure, fix and rerun until they do.

## Committing

Conventional commits, enforced by commitlint. Scope must be one of the enum in `commitlint.config.js`: `cli`, `dc` (dev-config), `vc` (vite-config), `vscode`. Example: `feat(cli): add add-changesets command`.
