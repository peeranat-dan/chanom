---
name: coding-standards
description: Coding standards and workflow for the chanom monorepo (Effect-TS architecture, TypeScript style, vitest testing, verify, commits). Use when adding or changing code in packages/cli, packages/dev-config, or packages/vite-config, when writing tests, or when committing work in this repo.
---

# Coding standards

pnpm + turbo monorepo. Workspace packages live in `packages/*` and `apps/*`.
Read the relevant reference **before** writing code so new code matches what
already exists — these are extracted from the real codebase, not generic advice.

## Which reference to load

| You are writing…                                           | Load                       |
| ---------------------------------------------------------- | -------------------------- |
| An `Effect.Service`, command, domain/util, error, or layer | `references/effect-ts.md`  |
| Any `.ts` file (types, imports, naming, module shape)      | `references/typescript.md` |
| A test under `test/` (unit, service, effect, stub layers)  | `references/vitest.md`     |

Most non-trivial changes touch more than one: a new command needs `effect-ts`
+ `typescript` for the code and `vitest` for its test. Load all that apply.

## Package structure

Match the existing layout of the package you touch:

- **@chanom/cli** (`packages/cli`) — layered Effect architecture; see
  `references/effect-ts.md` for the `domain`/`services`/`commands`/`utils` split
  and where side effects, pure logic, and tests belong. Service tags use the
  `cli/` namespace (e.g. `cli/Git`); test stubs live in `test/support/`.
- **@chanom/dev-config** (`packages/dev-config`) — one folder per tool
  `src/<tool>/` with `index.ts` (config factory) and `base-config.ts`. A new
  tool also needs `./<tool>/config` and `./<tool>/base` entries in package.json
  `exports`, mirroring the `development`/`types`/`default` conditions of
  existing entries.
- **@chanom/vite-config** (`packages/vite-config`) — single entry point;
  everything exports from `src/index.ts`.

Dependencies: versions come from the pnpm catalog (`pnpm-workspace.yaml`,
`catalogMode: strict`) — declare as `"catalog:"` and add the pinned version to
the catalog if missing. Intra-repo deps use `"workspace:*"`.

## Verify

After implementing, from the repo root:

```sh
pnpm turbo run build
pnpm turbo run test
pnpm lint
```

Done only when all three exit clean. On failure, fix and rerun until they do.

## Committing

Conventional commits, enforced by commitlint. Scope must be one of the enum in
`commitlint.config.js`: `cli`, `dc` (dev-config), `vc` (vite-config), `vscode`.
It should follow the pattern: `<type>(<scope>): <subject>`. Example:
`feat(cli): add add-changesets command`. Use the scope of the package you
touched, not the repo name — if you change `@chanom/cli`, use `cli` as the
scope, not `chanom-dev`.
