import { log } from '@clack/prompts';
import { existsSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

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

export function apply(cwd: string, pm: PackageManager): void {
  const existing = detectSetupFile('commitlint', cwd);
  if (existing) {
    log.warn(`\`${basename(existing)}\` already exists - skipping commitlint config`);
  } else {
    writeFileSync(
      join(cwd, '.commitlintrc.json'),
      JSON.stringify({ extends: ['@commitlint/config-conventional'] }, null, 2) + '\n',
    );
  }

  if (existsSync(join(cwd, '.husky'))) {
    const hookPath = join(cwd, '.husky', 'commit-msg');
    if (existsSync(hookPath)) {
      log.warn('`.husky/commit-msg` already exists - skipping');
    } else {
      writeFileSync(hookPath, [...PM_EXEC[pm], 'commitlint', '--edit', '$1'].join(' ') + '\n');
    }
  }
}
