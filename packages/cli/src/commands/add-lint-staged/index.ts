import { log } from '@clack/prompts';
import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { detectSetupFile } from '../../utils/detect-setup.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export type Linter = 'oxlint';
export type Formatter = 'oxfmt';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'lint-staged') ? [] : ['lint-staged'];
}

export const apply = (
  cwd: string,
  linters: Linter[] = [],
  formatters: Formatter[] = [],
  overwritePreCommit = false,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const existing = detectSetupFile('lint-staged', cwd);

    if (existing) {
      log.warn(`\`${path.basename(existing)}\` already exists - skipping lint-staged config`);
    } else {
      const config: Record<string, string[]> = {};

      const jsGlob = '**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}';

      if (linters.includes('oxlint')) {
        config[jsGlob] ??= [];
        config[jsGlob].push('oxlint --fix --no-error-on-unmatched-pattern');
      }

      if (formatters.includes('oxfmt')) {
        config['*'] ??= [];
        config['*'].push('oxfmt --no-error-on-unmatched-pattern');
      }

      yield* fs.writeFileString(
        path.join(cwd, '.lintstagedrc.json'),
        JSON.stringify(config, null, 2) + '\n',
      );
    }

    const huskyDir = path.join(cwd, '.husky');
    const huskyExists = yield* fs.exists(huskyDir);

    if (huskyExists) {
      const hookPath = path.join(huskyDir, 'pre-commit');
      const hookExists = yield* fs.exists(hookPath);
      if (hookExists && !overwritePreCommit) {
        log.warn('`.husky/pre-commit` already exists - skipping');
      } else {
        yield* fs.writeFileString(hookPath, 'lint-staged\n');
      }
    }
  });
