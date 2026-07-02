import { log } from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { PM_EXEC, type PackageManager } from '../../utils/detect-pm.ts';
import { isPackageInstalled, type Pkg } from '../../utils/pkg.ts';

export function getPackages(pkg: Pkg): string[] {
  return isPackageInstalled(pkg, 'husky') ? [] : ['husky'];
}

export function apply(cwd: string, pm: PackageManager): void {
  if (existsSync(join(cwd, '.husky'))) {
    log.warn('`.husky` already exists - skipping husky init');
    return;
  }
  const [cmd, ...args] = PM_EXEC[pm];
  spawnSync(cmd, [...args, 'husky', 'init'], { stdio: 'inherit', cwd });
}
