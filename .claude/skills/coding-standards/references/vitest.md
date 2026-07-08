# Vitest conventions

Tests use **`@effect/vitest`** and live under `test/`, mirroring `src/` file for
file (`src/domain/config.ts` → `test/domain/config.test.ts`). New code in any
layer gets a matching test.

## Imports and layout

Always import the test API from `@effect/vitest`, not `vitest`:

```ts
import { describe, expect, it } from '@effect/vitest';
```

Group with `describe` per unit-under-test (usually one per exported function or
service), and write behaviour-focused `it` names ("flags mismatches in both
directions", "is true when the diff exits non-zero").

## Pure code — plain `it`

Domain and logic functions are pure, so test them directly. No Effect, no
layers, just assert on return values:

```ts
describe('isInstalled', () => {
  it('finds entries in either dependency map', () => {
    expect(isInstalled({ dependencies: { tool: '1.0.0' } }, 'tool')).toBe(true);
  });
});
```

## Effectful code — `it.effect`

For services and orchestration, use `it.effect`. Return an `Effect` that does
the work inside `Effect.gen`, and provide a test layer with
`.pipe(Effect.provide(layer))`:

```ts
it.effect('runs the command and maps the exit code to ok', () => {
  const { layer, runner } = makeLayer(/* stubbed handler */);
  return Effect.gen(function* () {
    const svc = yield* Service;
    const result = yield* svc.run('/project', 'input');
    expect(result).toEqual({ ok: false, stdout: '', stderr: 'boom' });
  }).pipe(Effect.provide(layer));
});
```

## Test layers and stubs

Never hit the real filesystem, process, or terminal. Build the service under
test from its `.Default` and provide **in-memory stub layers**:

```ts
const makeLayer = (handler?: Handler, fs: TestFs = makeTestFs()) => {
  const runner = makeTestRunner(handler);
  const layer = Service.Default.pipe(Layer.provide(Layer.mergeAll(runner.layer, fs.layer)));
  return { layer, runner, fs };
};
```

Keep reusable stubs in `test/support/`, one factory per dependency, named
`makeTest<Name>` and returning `{ layer, …inspectables }` (e.g. an in-memory
`FileSystem` backed by a `Map`, a runner that records calls). Add new stubs
there rather than inlining them, and mirror the existing factories' shape.

## Asserting

- **Return values / side effects:** inspect the stub's mutable state — the
  in-memory file map, the recorded call list. Assert full call arrays with
  `toEqual` to pin down args and cwd.
- **Failures:** flip the effect and assert on the tagged error rather than
  try/catch:

  ```ts
  const error = yield* Effect.flip(svc.read('/missing'));
  expect(error._tag).toBe('SystemError');
  expect(error._tag === 'SystemError' && error.reason).toBe('NotFound');
  ```

- Prefer specific matchers (`toBe`, `toEqual`, `toBeUndefined`) over truthiness.
- Script prompt answers and command outputs through the stub factories to cover
  both the happy path and each failure branch.

## Running

From the repo root: `pnpm turbo run test` (or filter to a single package with
`pnpm --filter <pkg> test`). Tests must pass alongside `pnpm turbo run build`
and `pnpm lint` before a change is done.
