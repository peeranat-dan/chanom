import { log } from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isPackageInstalled, readPkg, type Pkg } from '../../utils/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'knip') ? [] : ['knip'];
}

export function apply(cwd: string): void {
  writeFileSync(
    join(cwd, 'knip.json'),
    JSON.stringify({ entry: ['src/index.ts'] }, null, 2) + '\n',
  );

  const { pkg, pkgPath } = readPkg(cwd);

  pkg.scripts ??= {};

  if (pkg.scripts['knip']) {
    log.warn('`knip` script already exists in package.json - skipping');
  } else {
    pkg.scripts['knip'] = 'knip';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}
