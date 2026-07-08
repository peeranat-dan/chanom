---
name: coding-standards
description: Coding conventions for the chanom monorepo (Effect-TS architecture, TypeScript style, vitest testing). Use when writing or reviewing TypeScript, Effect services/commands, or tests in packages/cli, packages/dev-config, or packages/vite-config, and load the matching reference file before writing code.
---

# Coding standards

House conventions for chanom, split into one reference file per topic. Read the
relevant reference **before** writing code so new code matches what already
exists — these are extracted from the real codebase, not generic advice.

## Which reference to load

| You are writing…                                              | Load                          |
| ------------------------------------------------------------- | ----------------------------- |
| An `Effect.Service`, command, domain/util, error, or layer    | `references/effect-ts.md`     |
| Any `.ts` file (types, imports, naming, module shape)         | `references/typescript.md`    |
| A test under `test/` (unit, service, effect, stub layers)     | `references/vitest.md`        |

Most non-trivial changes touch more than one: a new command needs `effect-ts`
+ `typescript` for the code and `vitest` for its test. Load all that apply.

## How to use these

- Treat each reference as a checklist of patterns, not a tutorial. Copy the
  shape of the closest existing example rather than inventing a new one.
- When a reference and an existing neighbouring file disagree, follow the
  neighbouring file and flag the drift.
- These standards sit under the broader `chanom-dev` skill, which covers
  package layout, the catalog dependency rule, verification, and commits.
