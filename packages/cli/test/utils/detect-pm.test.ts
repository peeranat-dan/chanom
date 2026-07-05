import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { detectPm } from '../../src/utils/detect-pm.ts';
import { makeTestFs } from '../support/fs.ts';

describe('detectPm', () => {
  it.effect('uses the packageManager field from package.json', () => {
    const fs = makeTestFs({ '/project/package.json': '{"packageManager":"yarn@4.5.0"}' });
    return Effect.gen(function* () {
      const pm = yield* detectPm('/project', 'pnpm/11.9.0 node/v22');
      expect(pm).toBe('yarn');
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('falls back to the user agent when the field is absent', () => {
    const fs = makeTestFs({ '/project/package.json': '{}' });
    return Effect.gen(function* () {
      const pm = yield* detectPm('/project', 'bun/1.1.0 node/v22');
      expect(pm).toBe('bun');
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('survives a missing package.json', () => {
    const fs = makeTestFs();
    return Effect.gen(function* () {
      const pm = yield* detectPm('/project', 'npm/10.0.0 node/v22');
      expect(pm).toBe('npm');
    }).pipe(Effect.provide(fs.layer));
  });

  it.effect('survives unparseable package.json and returns the fallback', () => {
    const fs = makeTestFs({ '/project/package.json': '{nope' });
    return Effect.gen(function* () {
      const pm = yield* detectPm('/project', undefined);
      expect(pm).toBe('pnpm');
    }).pipe(Effect.provide(fs.layer));
  });
});
