---
name: chanom-dev
description: Implement code in the chanom monorepo. Use when adding or changing code in packages/cli, packages/dev-config, or packages/vite-config, or when committing work in this repo.
---

# Working in chanom

pnpm + turbo monorepo. Workspace packages live in `packages/*` and `apps/*`.

## Package structure

Match the existing layout of the package you touch:

- **@chanom/cli** (`packages/cli`) - each command gets its own folder `src/commands/<name>/`: pure, side-effect-free logic in `logic.ts`; prompts, filesystem, and process I/O in `index.ts`. Cross-command helpers go in `src/utils/`.
- **@chanom/dev-config** (`packages/dev-config`) - one folder per tool `src/<tool>/` with `index.ts` (config factory) and `base-config.ts`. A new tool also needs `./<tool>/config` and `./<tool>/base` entries in package.json `exports`, mirroring the `development`/`types`/`default` conditions of existing entries.
- **@chanom/vite-config** (`packages/vite-config`) - single entry point; everything exports from `src/index.ts`.

Dependencies: versions come from the pnpm catalog (`pnpm-workspace.yaml`, `catalogMode: strict`) - declare as `"catalog:"` and add the pinned version to the catalog if missing. Intra-repo deps use `"workspace:*"`.

## Verify

After implementing, from the repo root:

```sh
pnpm turbo run build
pnpm lint
```

Done only when both exit clean. On failure, fix and rerun until they do.

## Committing

Conventional commits, enforced by commitlint. Scope must be one of the enum in `commitlint.config.js`: `cli`, `dc` (dev-config), `vc` (vite-config), `vscode`. Example: `feat(cli): add add-changesets command`.
