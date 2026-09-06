import { Prompter } from '@chanom/internal';
import { FileSystem, Path } from '@effect/platform';
import { Effect, Option } from 'effect';

import { configFileName } from '../../domain/setup.ts';
import { detectSetupFile } from '../../utils/detect-setup.ts';
import { buildConfig, type ConfigFiles, type Formatter, type Linter } from './logic.ts';

export { getPackages, type ConfigFiles, type Formatter, type Linter } from './logic.ts';

/**
 * Config file each tool will run against: an existing one when `add-oxlint` /
 * `add-oxfmt` skipped writing, otherwise the name they scaffold. lint-staged
 * invokes the same binaries as the package scripts, so it has to resolve the
 * config the same way.
 */
const resolveConfigFiles = Effect.fn('add-lint-staged.resolveConfigFiles')(function* (
  cwd: string,
  esm: boolean,
) {
  const path = yield* Path.Path;

  const resolve = Effect.fn(function* (tool: 'oxlint' | 'oxfmt') {
    const existing = yield* detectSetupFile(tool, cwd);
    return Option.match(existing, {
      onNone: () => configFileName(tool, esm),
      onSome: (file) => path.basename(file),
    });
  });

  return { oxlint: yield* resolve('oxlint'), oxfmt: yield* resolve('oxfmt') } satisfies ConfigFiles;
});

export const apply = Effect.fn('add-lint-staged.apply')(function* (
  cwd: string,
  esm: boolean,
  linters: readonly Linter[] = [],
  formatters: readonly Formatter[] = [],
  overwritePreCommit = false,
) {
  // An empty config makes lint-staged fail every commit, so write nothing.
  if (linters.length === 0 && formatters.length === 0) {
    yield* Effect.logDebug('no linters or formatters selected - skipping lint-staged setup');
    return;
  }

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const prompter = yield* Prompter;

  const existing = yield* detectSetupFile('lint-staged', cwd);

  if (Option.isSome(existing)) {
    yield* prompter.warn(
      `\`${path.basename(existing.value)}\` already exists - skipping lint-staged config`,
    );
  } else {
    const configFiles = yield* resolveConfigFiles(cwd, esm);
    yield* fs.writeFileString(
      path.join(cwd, '.lintstagedrc.json'),
      JSON.stringify(buildConfig(linters, formatters, configFiles), null, 2) + '\n',
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
