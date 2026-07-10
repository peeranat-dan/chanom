import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';

import type { PackageManager, WorkspaceHints } from '../domain/package-manager.ts';

import { workspaceRootFlags } from '../domain/package-manager.ts';
import { CommandRunner } from './command-runner.ts';

export class InstallFailed extends Data.TaggedError('InstallFailed')<{
  readonly pm: PackageManager;
}> {}

/**
 * Installs npm packages with the detected package manager, adding the
 * workspace-root flag (pnpm `-w`, yarn classic `-W`) when the target
 * directory is a workspace root.
 */
export class PackageInstaller extends Effect.Service<PackageInstaller>()('cli/PackageInstaller', {
  effect: Effect.gen(function* () {
    const runner = yield* CommandRunner;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const has = (cwd: string, file: string): Effect.Effect<boolean> =>
      fs.exists(path.join(cwd, file)).pipe(Effect.orElseSucceed(() => false));

    const hasWorkspacesField = (cwd: string): Effect.Effect<boolean> =>
      fs.readFileString(path.join(cwd, 'package.json')).pipe(
        Effect.flatMap((contents) =>
          Effect.try(
            () => (JSON.parse(contents) as { workspaces?: unknown }).workspaces !== undefined,
          ),
        ),
        Effect.orElseSucceed(() => false),
      );

    const workspaceHints = (cwd: string): Effect.Effect<WorkspaceHints> =>
      Effect.all(
        {
          hasPnpmWorkspaceFile: has(cwd, 'pnpm-workspace.yaml'),
          hasWorkspacesField: hasWorkspacesField(cwd),
          hasYarnBerryConfig: has(cwd, '.yarnrc.yml'),
        },
        { concurrency: 3 },
      );

    return {
      installDev: (pm: PackageManager, cwd: string, packages: readonly string[]) =>
        workspaceHints(cwd).pipe(
          Effect.flatMap((hints) =>
            runner.execInherit(
              pm,
              ['add', '-D', ...workspaceRootFlags(pm, hints), ...packages],
              cwd,
            ),
          ),
          Effect.filterOrFail(
            (code) => code === 0,
            () => new InstallFailed({ pm }),
          ),
          Effect.asVoid,
        ),
    } as const;
  }),
}) {}
