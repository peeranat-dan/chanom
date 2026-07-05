import { log } from '@clack/prompts';
import { FileSystem, Path } from '@effect/platform';
import { Effect } from 'effect';

import { PM_EXEC, type PackageManager } from '../../utils/detect-pm.ts';
import { detectSetupFile } from '../../utils/detect-setup.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  const missing: string[] = [];
  if (!isPackageInstalled(pkg, '@commitlint/cli')) {
    missing.push('@commitlint/cli');
  }
  if (!isPackageInstalled(pkg, '@commitlint/config-conventional')) {
    missing.push('@commitlint/config-conventional');
  }
  return missing;
}

export const apply = (cwd: string, pm: PackageManager) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const existing = detectSetupFile('commitlint', cwd);

    if (existing) {
      log.warn(`\`${path.basename(existing)}\` already exists - skipping commitlint config`);
    } else {
      yield* fs.writeFileString(
        path.join(cwd, '.commitlintrc.json'),
        JSON.stringify({ extends: ['@commitlint/config-conventional'] }, null, 2) + '\n',
      );
    }

    const huskyDir = path.join(cwd, '.husky');
    const huskyExists = yield* fs.exists(huskyDir);

    if (huskyExists) {
      const hookPath = path.join(huskyDir, 'commit-msg');
      const hookExists = yield* fs.exists(hookPath);
      if (hookExists) {
        log.warn('`.husky/commit-msg` already exists - skipping');
      } else {
        yield* fs.writeFileString(
          hookPath,
          [...PM_EXEC[pm], 'commitlint', '--edit', '$1'].join(' ') + '\n',
        );
      }
    }
  });
