# TypeScript conventions

Strict, ESM-only TypeScript. Configs extend `@tsconfig/node-lts` +
`@tsconfig/node-ts`, with the `@effect/language-service` plugin. oxlint runs
with `correctness: 'error'` and the `typescript`, `unicorn`, and `oxc` plugins,
so keep code lint-clean.

## Modules and imports

- ESM only (`"type": "module"`). Every relative import carries its **`.ts`
  extension**: `import { planScripts } from './logic.ts'`.
- Separate type-only imports with `import type`:

  ```ts
  import type { PlatformError } from '@effect/platform/Error';
  import type { Config } from './config.ts';

  import { FileSystem, Path } from '@effect/platform';
  import { Effect, Option } from 'effect';
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
- Add `as const` to literal objects and to capability records returned from
  services.

## Naming and style

- `camelCase` values/functions, `PascalCase` types/classes/service tags,
  `SCREAMING_SNAKE` only for true constants.
- Directory and span names are kebab-case (`add-thing`, `'thing.doStep'`).
- Keep functions small and single-purpose; push branching decisions into pure
  logic/domain helpers so orchestration reads as a straight sequence.
- Comments explain **why** (edge cases, casts, non-obvious ordering), not what
  the code already says.
