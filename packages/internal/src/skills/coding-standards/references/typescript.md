# TypeScript

## Types

- Never use `any`. Reach for generics and utility types; when you must escape
  the type system use `unknown` and narrow explicitly.
- Type-only imports use `import type { ... }`. A mixed import splits its type
  part into a separate `import type` line.
- Derive types from their source rather than restating them — `z.infer` for a
  schema, `ReturnType`/`Parameters` for a function, `typeof` for a const object.
  A hand-written duplicate drifts.
- Props and params objects are declared as `interface`, named after their owner:
  `interface UserCardProps`, `interface UseCurrentUserParams`.

## Modules

- Functions, not classes. Hooks, utils, factories, and components are plain
  exported functions.
- Export inline (`export function formatDate(...)`) rather than a trailing
  `export { ... }` block.
- Import order is enforced by oxlint — run `pnpm lint --fix` rather than
  hand-sorting.

## Errors

Throw `Error` (or a subclass) with a message naming what failed and the value
that caused it. An unused catch binding is omitted: `catch {`, not
`catch (_e) {`.
