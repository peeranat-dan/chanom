# Vitest conventions for Effect

Additions on top of `vitest.md` for testing Effect services and orchestration —
read that file first. The layout, naming, matcher, and running rules there still
apply.

## Import the Effect-aware API

Import the test API from `@effect/vitest` instead of `vitest` — it re-exports
the vitest API plus `it.effect`:

```ts
import { describe, expect, it } from '@effect/vitest';
```

## Effectful tests — `it.effect`

Return an `Effect` that does the work inside `Effect.gen`, and provide a test
layer with `.pipe(Effect.provide(layer))`:

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

## Asserting on Effect code

- **Side effects:** inspect the stub's mutable state — the in-memory file map,
  the recorded call list. Assert full call arrays with `toEqual` to pin down
  args and cwd.
- **Failures:** flip the effect and assert on the tagged error rather than
  try/catch:

  ```ts
  const error = yield* Effect.flip(svc.read('/missing'));
  expect(error._tag).toBe('SystemError');
  expect(error._tag === 'SystemError' && error.reason).toBe('NotFound');
  ```

- Script prompt answers and command outputs through the stub factories to cover
  both the happy path and each failure branch.
