import { log } from '@clack/prompts';
import { Command, FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';

import { PM_EXEC, type PackageManager } from '../../utils/detect-pm.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export class HuskyInitFailed extends Data.TaggedError('HuskyInitFailed')<{
  readonly exitCode: number;
}> {}

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'husky') ? [] : ['husky'];
}

export const apply = (cwd: string, pm: PackageManager) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const huskyDir = path.join(cwd, '.husky');
    const huskyExists = yield* fs.exists(huskyDir);

    if (huskyExists) {
      log.warn('`.husky` already exists - skipping husky init');
      return;
    }

    const [cmd, ...args] = PM_EXEC[pm];
    const exitCode = yield* Command.make(cmd, ...args, 'husky', 'init').pipe(
      Command.workingDirectory(cwd),
      Command.stdout('inherit'),
      Command.stderr('inherit'),
      Command.exitCode,
    );

    if (exitCode !== 0) {
      return yield* new HuskyInitFailed({ exitCode });
    }
  });
