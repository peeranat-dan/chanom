---
name: coding-standards
description: Coding standards for this Vite + React + TypeScript app. Use when writing or changing components, hooks, utils, or tests, and before committing.
---

# Coding standards

Vite + React 19 + TypeScript, scaffolded with `create-chanom-app`. oxlint lints,
oxfmt formats, vitest tests. Read the reference for what you touch **before**
writing, so new code matches the code already here.

## Which reference to load

| You are writing…                             | Load                       |
| -------------------------------------------- | -------------------------- |
| Any `.ts` / `.tsx` file                      | `references/typescript.md` |
| A component, hook, or anything rendering JSX | `references/react.md`      |
| A `*.test.ts` / `*.test.tsx` file            | `references/vitest.md`     |

These layer: a new component with a test reads all three. Load every row that
applies.

## Universal rules

- Filenames are kebab-case: `user-card.tsx`, `use-current-user.ts`, `format-date.ts`.
- Before adding a file, open two neighbouring files of the same kind and match
  their shape — import order, export style, test naming.
- Source lives under `src/`. Colocate a test beside the code it covers:
  `src/utils/format-date.ts` → `src/utils/format-date.test.ts`.

## Verify

After implementing, from the project root:

```sh
pnpm lint
pnpm test
pnpm build
pnpm typecheck
```

Done only when all four exit clean. On failure, fix and rerun until they do.
Run `pnpm format` before committing. Comment- or doc-only changes may skip all
four.

## Committing

Ask before committing. Use conventional commits under 100 characters:
`<type>(<scope>): <subject>`, e.g. `feat(auth): add sign-out button`. Scope is
the area you touched, not the repo name.
