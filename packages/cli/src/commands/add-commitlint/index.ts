import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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

export function apply(cwd: string): void {
  writeFileSync(
    join(cwd, '.commitlintrc.json'),
    JSON.stringify({ extends: ['@commitlint/config-conventional'] }, null, 2) + '\n',
  );

  if (existsSync(join(cwd, '.husky'))) {
    writeFileSync(join(cwd, '.husky', 'commit-msg'), 'npx --no -- commitlint --edit $' + '1\n');
  }
}
