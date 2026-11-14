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

Group with one `describe` per unit-under-test (usually one per exported
function). Name each `it` as `'should ... [when ...]'`, putting the condition in
the name rather than in a nested block:

```ts
describe('validateEnv', () => {
  it('should freeze the returned env', () => {});
  it('should keep empty strings when emptyStringAsUndefined is false', () => {});
});
```

Nest a `describe('when ...')` only to share setup between several tests, never
just to group by condition:

```ts
describe('createEnv', () => {
  describe('when running on the client', () => {
    const clientEnv = () => createEnv({ ..., isServer: false });

    it('should skip server variables', () => {});
    it('should throw when client code reads a server variable', () => {});
  });
});
```

## Testing pure functions

Assert directly on return values - no setup, no mocks:

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
