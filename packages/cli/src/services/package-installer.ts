import { CommandRunner, PackageManager } from '@chanom/internal';
import { Context, Effect, FileSystem, Layer, Path, Schema } from 'effect';

import type { WorkspaceHints } from '../domain/package-manager.ts';

import { workspaceRootFlags } from '../domain/package-manager.ts';

export class InstallFailed extends Schema.TaggedError<InstallFailed>()('InstallFailed', {
  pm: PackageManager,
  /** Captured package manager output, since it is not streamed to the terminal. */
  output: Schema.String,
}) {}

const decodeWorkspacesField = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Struct({ workspaces: Schema.optionalKey(Schema.Unknown) })),
);

/**
 * Installs npm packages with the detected package manager, adding the
 * workspace-root flag (pnpm `-w`, yarn classic `-W`) when the target
 * directory is a workspace root. Output is captured rather than inherited so
 * the caller's spinner is not redrawn over the package manager's own progress.
 */
export class PackageInstaller extends Context.Service<PackageInstaller>()('cli/PackageInstaller', {
  make: Effect.gen(function* () {
    const runner = yield* CommandRunner;
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const has = (cwd: string, file: string): Effect.Effect<boolean> =>
      fs.exists(path.join(cwd, file)).pipe(Effect.orElseSucceed(() => false));

    const hasWorkspacesField = (cwd: string): Effect.Effect<boolean> =>
      fs.readFileString(path.join(cwd, 'package.json')).pipe(
        Effect.flatMap(decodeWorkspacesField),
        Effect.map((pkg) => pkg.workspaces !== undefined),
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
}) {
  static readonly layer = Layer.effect(this, this.make);
}
