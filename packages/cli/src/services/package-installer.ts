import { CommandRunner } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';

import type { PackageManager, WorkspaceHints } from '../domain/package-manager.ts';

import { workspaceRootFlags } from '../domain/package-manager.ts';

export class InstallFailed extends Data.TaggedError('InstallFailed')<{
  readonly pm: PackageManager;
  /** Captured package manager output, since it is not streamed to the terminal. */
  readonly output: string;
}> {}

/**
 * Installs npm packages with the detected package manager, adding the
 * workspace-root flag (pnpm `-w`, yarn classic `-W`) when the target
 * directory is a workspace root. Output is captured rather than inherited so
 * the caller's spinner is not redrawn over the package manager's own progress.
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
            runner.capture(pm, ['add', '-D', ...workspaceRootFlags(pm, hints), ...packages], cwd),
          ),
          Effect.filterOrFail(
            (result) => result.exitCode === 0,
            (result) =>
              new InstallFailed({
                pm,
                output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
              }),
          ),
          Effect.asVoid,
        ),
    } as const;
  }),
}) {}
