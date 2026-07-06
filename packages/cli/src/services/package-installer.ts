import { Data, Effect } from 'effect';

import type { PackageManager } from '../domain/package-manager.ts';

import { CommandRunner } from './command-runner.ts';

export class InstallFailed extends Data.TaggedError('InstallFailed')<{
  readonly pm: PackageManager;
}> {}

/** Installs npm packages with the detected package manager. */
export class PackageInstaller extends Effect.Service<PackageInstaller>()('cli/PackageInstaller', {
  effect: Effect.gen(function* () {
    const runner = yield* CommandRunner;

    return {
      installDev: (pm: PackageManager, cwd: string, packages: readonly string[]) =>
        runner.execInherit(pm, ['add', '-D', ...packages], cwd).pipe(
          Effect.filterOrFail(
            (code) => code === 0,
            () => new InstallFailed({ pm }),
          ),
          Effect.asVoid,
        ),
    } as const;
  }),
}) {}
