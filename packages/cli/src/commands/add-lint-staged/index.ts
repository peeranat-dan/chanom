import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import { Prompter } from '../../services/prompter.ts';
import { detectSetupFile } from '../../utils/detect-setup.ts';
import { buildConfig, type Formatter, type Linter } from './logic.ts';

export { getPackages, type Formatter, type Linter } from './logic.ts';

export const apply = Effect.fn('add-lint-staged.apply')(function* (
  cwd: string,
  linters: readonly Linter[] = [],
  formatters: readonly Formatter[] = [],
  overwritePreCommit = false,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const existing = yield* detectSetupFile('lint-staged', cwd);

  if (Option.isSome(existing)) {
    yield* prompter.warn(
      `\`${path.basename(existing.value)}\` already exists - skipping lint-staged config`,
    );
  } else {
    yield* fs.writeFileString(
      path.join(cwd, '.lintstagedrc.json'),
      JSON.stringify(buildConfig(linters, formatters), null, 2) + '\n',
    );
  }

  const huskyDir = path.join(cwd, '.husky');

  if (yield* fs.exists(huskyDir)) {
    const hookPath = path.join(huskyDir, 'pre-commit');
    const hookExists = yield* fs.exists(hookPath);
    if (hookExists && !overwritePreCommit) {
      yield* prompter.warn('`.husky/pre-commit` already exists - skipping');
    } else {
      yield* fs.writeFileString(hookPath, 'lint-staged\n');
    }
  }
});
