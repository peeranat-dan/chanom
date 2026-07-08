# Vitest conventions

Tests live under `test/`, mirroring `src/` file for file
(`src/domain/config.ts` → `test/domain/config.test.ts`). New code gets a
matching test.

Framework-neutral. For testing Effect code (services, layers, `it.effect`),
read `vitest-effect.md` in addition to this file.

## Imports and layout

```ts
import { describe, expect, it } from 'vitest';
```

Group with `describe` per unit-under-test (usually one per exported function),
and write behaviour-focused `it` names ("flags mismatches in both directions",
"is true when the diff exits non-zero").

## Testing pure functions

Assert directly on return values — no setup, no mocks:

```ts
describe('isInstalled', () => {
  it('finds entries in either dependency map', () => {
    expect(isInstalled({ dependencies: { tool: '1.0.0' } }, 'tool')).toBe(true);
  });
});
```

## Asserting

- Prefer specific matchers (`toBe`, `toEqual`, `toBeUndefined`) over truthiness.
- Assert full objects/arrays with `toEqual` to pin down exact shape.
- Cover the happy path and each branch, including failure inputs.

## Running

From the repo root: `pnpm turbo run test` (or filter to a single package with
`pnpm --filter <pkg> test`). Tests must pass alongside `pnpm turbo run build`
and `pnpm lint` before a change is done.
