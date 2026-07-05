import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import { PackageInstaller } from '../../src/services/package-installer.ts';
import { makeTestRunner } from '../support/command-runner.ts';

describe('PackageInstaller', () => {
  it.effect('installs dev dependencies with the given package manager', () => {
    const runner = makeTestRunner();
    const layer = PackageInstaller.Default.pipe(Layer.provide(runner.layer));
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('pnpm', '/project', ['oxlint@2.0.0', 'knip']);
      expect(runner.calls).toEqual([
        { cmd: 'pnpm', args: ['add', '-D', 'oxlint@2.0.0', 'knip'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('fails with InstallFailed when the install exits non-zero', () => {
    const runner = makeTestRunner(() => ({ exitCode: 1, stdout: '', stderr: '' }));
    const layer = PackageInstaller.Default.pipe(Layer.provide(runner.layer));
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      const error = yield* Effect.flip(installer.installDev('npm', '/project', ['oxlint']));
      expect(error._tag).toBe('InstallFailed');
      expect(error).toMatchObject({ pm: 'npm' });
    }).pipe(Effect.provide(layer));
  });
});
