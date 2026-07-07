import { FileSystem, Path } from '@effect/platform';
import { Data, Effect } from 'effect';

import { type PackageManager, PM_EXEC } from '../../domain/package-manager.ts';
import { CommandRunner } from '../../services/command-runner.ts';
import { Prompter } from '../../services/prompter.ts';

export { getPackages } from './logic.ts';

export class HuskyInitFailed extends Data.TaggedError('HuskyInitFailed')<{
  readonly exitCode: number;
}> {}

export const apply = Effect.fn('add-husky.apply')(function* (cwd: string, pm: PackageManager) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;
  const runner = yield* CommandRunner;

  const huskyDir = path.join(cwd, '.husky');

  if (yield* fs.exists(huskyDir)) {
    yield* prompter.warn('`.husky` already exists - skipping husky init');
    return;
  }

  const [cmd, ...args] = PM_EXEC[pm];
  const exitCode = yield* runner.execInherit(cmd, [...args, 'husky', 'init'], cwd);

  if (exitCode !== 0) {
    return yield* new HuskyInitFailed({ exitCode });
  }
});
