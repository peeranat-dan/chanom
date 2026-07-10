import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';

import type { CommandHandler } from '../support/command-runner.ts';

import { PackageInstaller } from '../../src/services/package-installer.ts';
import { makeTestRunner } from '../support/command-runner.ts';
import { makeTestFs } from '../support/fs.ts';

const makeLayer = (
  options: { readonly files?: Record<string, string>; readonly handler?: CommandHandler } = {},
) => {
  const runner = makeTestRunner(options.handler);
  const fs = makeTestFs(options.files);
  const layer = PackageInstaller.Default.pipe(
    Layer.provide(Layer.mergeAll(runner.layer, fs.layer)),
  );
  return { layer, runner };
};

describe('PackageInstaller', () => {
  it.effect('installs dev dependencies with the given package manager', () => {
    const { layer, runner } = makeLayer();
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('pnpm', '/project', ['oxlint@2.0.0', 'knip']);
      expect(runner.calls).toEqual([
        { cmd: 'pnpm', args: ['add', '-D', 'oxlint@2.0.0', 'knip'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('adds -w when installing at a pnpm workspace root', () => {
    const { layer, runner } = makeLayer({
      files: { '/project/pnpm-workspace.yaml': 'packages:\n  - packages/*\n' },
    });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('pnpm', '/project', ['oxlint']);
      expect(runner.calls).toEqual([
        { cmd: 'pnpm', args: ['add', '-D', '-w', 'oxlint'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('adds -W when installing at a yarn classic workspace root', () => {
    const { layer, runner } = makeLayer({
      files: { '/project/package.json': '{ "workspaces": ["packages/*"] }' },
    });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('yarn', '/project', ['oxlint']);
      expect(runner.calls).toEqual([
        { cmd: 'yarn', args: ['add', '-D', '-W', 'oxlint'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('adds no root flag for yarn berry workspaces', () => {
    const { layer, runner } = makeLayer({
      files: {
        '/project/package.json': '{ "workspaces": ["packages/*"] }',
        '/project/.yarnrc.yml': 'nodeLinker: node-modules\n',
      },
    });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('yarn', '/project', ['oxlint']);
      expect(runner.calls).toEqual([
        { cmd: 'yarn', args: ['add', '-D', 'oxlint'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('adds no root flag for npm workspaces', () => {
    const { layer, runner } = makeLayer({
      files: { '/project/package.json': '{ "workspaces": ["packages/*"] }' },
    });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('npm', '/project', ['oxlint']);
      expect(runner.calls).toEqual([
        { cmd: 'npm', args: ['add', '-D', 'oxlint'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('ignores an unparseable package.json when detecting workspaces', () => {
    const { layer, runner } = makeLayer({
      files: { '/project/package.json': 'not json' },
    });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      yield* installer.installDev('yarn', '/project', ['oxlint']);
      expect(runner.calls).toEqual([
        { cmd: 'yarn', args: ['add', '-D', 'oxlint'], cwd: '/project' },
      ]);
    }).pipe(Effect.provide(layer));
  });

  it.effect('fails with InstallFailed when the install exits non-zero', () => {
    const { layer } = makeLayer({ handler: () => ({ exitCode: 1, stdout: '', stderr: '' }) });
    return Effect.gen(function* () {
      const installer = yield* PackageInstaller;
      const error = yield* Effect.flip(installer.installDev('npm', '/project', ['oxlint']));
      expect(error._tag).toBe('InstallFailed');
      expect(error).toMatchObject({ pm: 'npm' });
    }).pipe(Effect.provide(layer));
  });
});
