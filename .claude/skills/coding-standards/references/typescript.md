# TypeScript conventions

Strict, ESM-only TypeScript. Configs extend `@tsconfig/node-lts` +
`@tsconfig/node-ts`. oxlint runs with `correctness: 'error'` and the
`typescript`, `unicorn`, and `oxc` plugins, so keep code lint-clean.

Framework-neutral. For conventions that only apply to Effect code, read
`typescript-effect.md` in addition to this file.

## Modules and imports

- ESM only (`"type": "module"`). Every relative import carries its **`.ts`
  extension**: `import { planScripts } from './logic.ts'`.
- Separate type-only imports with `import type`:

  ```ts
  import type { Config } from './config.ts';

  import { readConfig } from './config.ts';
  ```

- Import grouping: type imports first, then value imports, blank-line
  separated; third-party before local.
- Re-export narrowly when a module exposes pure helpers to siblings:
  `export { planScripts } from './logic.ts'`.

## Types

- Model object shapes with `interface`, and mark every field `readonly`:

  ```ts
  export interface Config {
    readonly mode?: 'strict' | 'loose';
    readonly scripts?: Readonly<Record<string, string>>;
  }
  ```

- Use `readonly T[]` for array parameters and `Readonly<Record<K, V>>` for maps.
- Prefer `undefined` (with optional `?` props) over `null`.
- Give **exported functions explicit return types**; let inference handle locals.
- Narrow unions instead of casting. Use type-guard predicates
  (`(result): result is T => …`) and reserve `as` for the rare spots the type
  system can't express (always with a comment explaining why).
- Never use `any`. Reach for `unknown` + narrowing when a type is genuinely open.
- Add `as const` to literal objects whose exact types must be preserved.

## Naming and style

- `camelCase` values/functions, `PascalCase` types/classes,
  `SCREAMING_SNAKE` only for true constants.
- Directory names are kebab-case (`add-thing`).
- Keep functions small and single-purpose; push branching decisions into pure
  helpers so the top-level flow reads as a straight sequence.
- Comments explain **why** (edge cases, casts, non-obvious ordering), not what
  the code already says.
